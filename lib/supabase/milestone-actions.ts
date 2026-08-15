"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Milestone authoring.
 *
 * `project_milestones` was readable and nothing else: the table had no INSERT,
 * UPDATE or DELETE path anywhere in the application, and its write policies
 * were admin-only. Every milestone in the database therefore arrived through
 * `seed/demo_projects.sql`.
 *
 * That mattered more than it looks. The client portal's Milestone Roadmap, the
 * project timeline and the "Next Milestone" KPI on the client overview all read
 * this table, so three visible features were permanently frozen against demo
 * rows. Migration 0061 opened the write policies to staff who can see the
 * project; this module is the path that uses them.
 *
 * Progress is stored per milestone but the project's own completion is derived
 * from these rows, never written back to `projects` — the same
 * derive-don't-store rule the invoice totals follow.
 */

export type MilestoneRow = Database["public"]["Tables"]["project_milestones"]["Row"];
export type MilestoneStatus = Database["public"]["Enums"]["milestone_status"];

const STATUSES: MilestoneStatus[] = ["done", "active", "upcoming", "final"];

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

export type ProjectMilestone = MilestoneRow & { leadName: string | null };

/** Milestones for one project, in board order. */
export async function listProjectMilestones(projectId: string): Promise<ProjectMilestone[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_milestones")
    .select("*, lead:profiles ( full_name, email )")
    .eq("project_id", projectId)
    .order("display_order");

  return ((data ?? []) as unknown as (MilestoneRow & {
    lead: { full_name: string | null; email: string } | null;
  })[]).map((m) => ({
    ...m,
    leadName: m.lead?.full_name || m.lead?.email || null,
  }));
}

function readForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const phase = String(formData.get("phase") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const status = String(formData.get("status") ?? "upcoming").trim();
  const dueDate = String(formData.get("dueDate") ?? "").trim() || null;
  const leadId = String(formData.get("leadId") ?? "").trim() || null;

  const rawProgress = String(formData.get("progress") ?? "").trim();
  const progress = rawProgress === "" ? null : Number(rawProgress);

  return { title, phase, description, status, dueDate, leadId, progress };
}

function validate(f: ReturnType<typeof readForm>): string | null {
  if (f.title.length < 2) return "Give the milestone a title.";
  if (f.title.length > 200) return "That title is too long.";
  if (f.phase.length < 1) return "Name the phase this milestone belongs to.";
  if (!STATUSES.includes(f.status as MilestoneStatus)) return "That status does not exist.";
  if (f.progress !== null && (!Number.isFinite(f.progress) || f.progress < 0 || f.progress > 100)) {
    return "Progress must be between 0 and 100.";
  }
  // A date that cannot be parsed is worse than no date: it sorts as epoch and
  // silently claims the milestone is overdue.
  if (f.dueDate && Number.isNaN(new Date(f.dueDate).getTime())) {
    return "That due date is not a valid date.";
  }
  return null;
}

export async function createMilestone(
  formData: FormData
): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient();

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { error: "Choose a project." };

  const f = readForm(formData);
  const invalid = validate(f);
  if (invalid) return { error: invalid };

  const { data: last } = await supabase
    .from("project_milestones")
    .select("display_order")
    .eq("project_id", projectId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("project_milestones")
    .insert({
      project_id: projectId,
      title: f.title,
      phase: f.phase,
      description: f.description,
      status: f.status as MilestoneStatus,
      due_date: f.dueDate,
      lead_id: f.leadId,
      progress: f.progress,
      display_order: (last?.display_order ?? -1) + 1,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: friendly(error?.message ?? "Unknown error", "create that milestone") };
  }

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  revalidatePath("/client");
  revalidatePath("/admin/projects");
  return { ok: true, id: data.id };
}

export async function updateMilestone(id: string, formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const f = readForm(formData);
  const invalid = validate(f);
  if (invalid) return { error: invalid };

  const { error } = await supabase
    .from("project_milestones")
    .update({
      title: f.title,
      phase: f.phase,
      description: f.description,
      status: f.status as MilestoneStatus,
      due_date: f.dueDate,
      lead_id: f.leadId,
      progress: f.progress,
    })
    .eq("id", id);

  if (error) return { error: friendly(error.message, "save that milestone") };

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  revalidatePath("/client");
  return { ok: true };
}

export async function setMilestoneStatus(
  id: string,
  status: MilestoneStatus
): Promise<Result> {
  if (!STATUSES.includes(status)) return { error: "That status does not exist." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("project_milestones")
    // Reaching "done" without 100% progress is a contradiction the roadmap
    // would render as a completed phase with a half-filled bar.
    .update(status === "done" ? { status, progress: 100 } : { status })
    .eq("id", id);

  if (error) return { error: friendly(error.message, "update that milestone") };

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  revalidatePath("/client");
  return { ok: true };
}

export async function deleteMilestone(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("project_milestones").delete().eq("id", id);
  if (error) return { error: friendly(error.message, "delete that milestone") };

  revalidatePath("/staff/projects");
  revalidatePath("/client/projects");
  revalidatePath("/client");
  return { ok: true };
}
