"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Task mutations for the staff board.
 *
 * Moving a card writes through here rather than living in component state, so
 * a drag actually changes something. The board used to hold its cards in
 * `useState` over a hardcoded array — a drop looked like it worked and was
 * forgotten on the next render.
 */

export type BoardColumn = Database["public"]["Enums"]["board_column"];

type Result = { ok: true } | { error: string };

const COLUMNS: BoardColumn[] = ["backlog", "in-progress", "review", "done"];

export async function moveTask(
  taskId: string,
  columnId: string,
  displayOrder: number
): Promise<Result> {
  if (!COLUMNS.includes(columnId as BoardColumn)) {
    return { error: "That column does not exist." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({ column_id: columnId as BoardColumn, display_order: displayOrder })
    .eq("id", taskId);

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You do not have permission to move that task."
        : "Could not move that task.",
    };
  }

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}

/**
 * Creates a card.
 *
 * The board could move cards and never make one, so every task in the system
 * arrived through `seed/demo_projects.sql`. A Kanban board that cannot add
 * work is a viewer, not a board.
 *
 * `display_order` is computed from the tail of the target column rather than
 * defaulted, so a new card lands at the bottom where the person who created it
 * expects it, instead of jumping to the top on the next sort.
 */
export async function createTask(
  formData: FormData
): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient();

  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const columnId = String(formData.get("columnId") ?? "backlog").trim();
  const description = String(formData.get("description") ?? "").trim();
  const discipline = String(formData.get("discipline") ?? "").trim() || "General";
  const assigneeId = String(formData.get("assigneeId") ?? "").trim() || null;
  const priority = formData.get("priority") === "on" || formData.get("priority") === "true";

  if (!projectId) return { error: "Choose a project." };
  if (title.length < 2) return { error: "Give the task a title." };
  if (title.length > 200) return { error: "That title is too long." };
  if (!COLUMNS.includes(columnId as BoardColumn)) {
    return { error: "That column does not exist." };
  }

  const { data: last } = await supabase
    .from("project_tasks")
    .select("display_order")
    .eq("project_id", projectId)
    .eq("column_id", columnId as BoardColumn)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_tasks")
    .insert({
      project_id: projectId,
      title,
      description,
      discipline,
      column_id: columnId as BoardColumn,
      assignee_id: assigneeId,
      priority,
      display_order: (last?.display_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      error: (error?.message ?? "").toLowerCase().includes("row-level security")
        ? "You do not have permission to add tasks to that project."
        : `Could not create that task. ${error?.message ?? ""}`.trim(),
    };
  }

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  revalidatePath("/admin/projects");
  return { ok: true, id: data.id };
}

/** Edits a card's own fields. Column and order stay owned by `moveTask`. */
export async function updateTask(taskId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) return { error: "Give the task a title." };
  if (title.length > 200) return { error: "That title is too long." };

  const { error } = await supabase
    .from("project_tasks")
    .update({
      title,
      description: String(formData.get("description") ?? "").trim(),
      discipline: String(formData.get("discipline") ?? "").trim() || "General",
      assignee_id: String(formData.get("assigneeId") ?? "").trim() || null,
      priority: formData.get("priority") === "on" || formData.get("priority") === "true",
      awaiting_approval:
        formData.get("awaitingApproval") === "on" ||
        formData.get("awaitingApproval") === "true",
    })
    .eq("id", taskId);

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You do not have permission to edit that task."
        : "Could not save that task.",
    };
  }

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}

export async function deleteTask(taskId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_tasks").delete().eq("id", taskId);
  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You do not have permission to delete that task."
        : "Could not delete that task.",
    };
  }

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}

export async function setTaskAssignee(
  taskId: string,
  assigneeId: string | null
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_tasks")
    .update({ assignee_id: assigneeId })
    .eq("id", taskId);
  if (error) return { error: "Could not reassign that task." };

  // A trigger notifies the new assignee; nothing to do here beyond the write.
  revalidatePath("/staff/projects");
  return { ok: true };
}
