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
