"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { ensureProjectChannel } from "./message-actions";
import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Project administration.
 *
 * Reads live in project-queries.ts, which maps rows into the shape the client
 * portal renders. This module is the write side plus the admin list, which
 * wants the raw row — the portal's `PortalProject` deliberately drops the
 * organisation and the real id, and an admin table needs both.
 */

export type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];
export type ProjectStatus = Database["public"]["Enums"]["project_status"];

export type AdminProject = ProjectRow & {
  organizations: { id: string; name: string } | null;
  lead: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
  /** Derived by the project_progress view from task completion. */
  progress: number;
  taskCount: number;
  milestoneCount: number;
};

export async function listAdminProjects(): Promise<AdminProject[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("projects")
    .select(
      "*, organizations ( id, name )," +
        " lead:profiles!projects_lead_id_fkey ( id, full_name, email, avatar_url )"
    )
    .order("featured", { ascending: false })
    .order("name");

  const rows = (data ?? []) as unknown as Array<
    ProjectRow & {
      organizations: { id: string; name: string } | null;
      lead: { id: string; full_name: string; email: string; avatar_url: string | null } | null;
    }
  >;
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Three reads rather than embeds: project_progress is a view, and PostgREST
  // resolves embeds through foreign key metadata a view does not have. Counts
  // come from the same round trip so the badges match the board.
  const [progressRes, tasksRes, milestonesRes] = await Promise.all([
    supabase.from("project_progress").select("project_id, progress").in("project_id", ids),
    supabase.from("project_tasks").select("project_id").in("project_id", ids),
    supabase.from("project_milestones").select("project_id").in("project_id", ids),
  ]);

  const progress = new Map(
    (progressRes.data ?? []).map((r) => [r.project_id as string, (r.progress as number) ?? 0])
  );
  const tally = (rows_: { project_id: string }[] | null) => {
    const m = new Map<string, number>();
    for (const r of rows_ ?? []) m.set(r.project_id, (m.get(r.project_id) ?? 0) + 1);
    return m;
  };
  const tasks = tally(tasksRes.data as { project_id: string }[] | null);
  const milestones = tally(milestonesRes.data as { project_id: string }[] | null);

  return rows.map((r) => ({
    ...r,
    progress: progress.get(r.id) ?? 0,
    taskCount: tasks.get(r.id) ?? 0,
    milestoneCount: milestones.get(r.id) ?? 0,
  }));
}

/* -------------------------------------------------------------- options -- */

export type ProjectOptions = {
  organizations: { id: string; name: string }[];
  leads: { id: string; full_name: string; email: string }[];
};

/** Everything the create and edit forms need to offer, in one round trip. */
export async function getProjectOptions(): Promise<ProjectOptions> {
  const supabase = await createClient();
  const [orgs, staff] = await Promise.all([
    supabase.from("organizations").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("portal", ["STAFF", "ADMIN"])
      .eq("is_active", true)
      .order("full_name"),
  ]);

  return {
    organizations: (orgs.data ?? []) as { id: string; name: string }[],
    leads: (staff.data ?? []) as { id: string; full_name: string; email: string }[],
  };
}

/* ------------------------------------------------------------ mutations -- */

type Result<T = void> = T extends void
  ? { ok: true } | { error: string }
  : { ok: true; data: T } | { error: string };

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

function readForm(form: FormData) {
  const name = String(form.get("name") ?? "").trim();
  const budgetTotal = Number(form.get("budgetTotal") ?? 0);
  const budgetSpent = Number(form.get("budgetSpent") ?? 0);
  const startDate = String(form.get("startDate") ?? "").trim();
  const targetEnd = String(form.get("targetEnd") ?? "").trim();

  return {
    name,
    description: String(form.get("description") ?? "").trim(),
    organization_id: String(form.get("organizationId") ?? "").trim(),
    status: String(form.get("status") ?? "Active") as ProjectStatus,
    stage: String(form.get("stage") ?? "").trim(),
    lead_id: String(form.get("leadId") ?? "").trim() || null,
    start_date: startDate || null,
    target_end: targetEnd || null,
    budget_total: budgetTotal,
    budget_spent: budgetSpent,
    featured: form.get("featured") === "on" || form.get("featured") === "true",
  };
}

function validate(v: ReturnType<typeof readForm>): string | null {
  if (v.name.length < 2) return "Give the project a name.";
  if (!v.organization_id) return "Choose the client this project belongs to.";
  if (!Number.isFinite(v.budget_total) || v.budget_total < 0) return "Budget must be zero or more.";
  if (!Number.isFinite(v.budget_spent) || v.budget_spent < 0) return "Spend must be zero or more.";
  // Caught here as well as by the CHECK constraint, so the user gets a
  // sentence rather than a Postgres error string.
  if (v.start_date && v.target_end && v.target_end < v.start_date) {
    return "The target end date cannot fall before the start date.";
  }
  return null;
}

export async function createProject(form: FormData): Promise<Result<{ id: string }>> {
  const supabase = await createClient();
  const values = readForm(form);
  const problem = validate(values);
  if (problem) return { error: problem };

  // Slug collisions are resolved with a suffix rather than refused: two clients
  // legitimately having a "Website Refresh" is not an error the user caused.
  const base = slugify(values.name) || "project";
  // One statement instead of up to 48 sequential round trips. The unique
  // constraint still backs this; the RPC just stops the happy path from
  // polling and stops a race surfacing as a raw constraint error.
  const { data: allocated } = await supabase.rpc("next_available_slug", {
    p_table: "projects",
    p_base: base,
  });
  // Falls back to the base when the RPC is unavailable; the unique constraint
  // is still the thing that actually guarantees uniqueness.
  const slug = allocated ?? base;

  const { data, error } = await supabase
    .from("projects")
    .insert({ ...values, slug })
    .select("id")
    .single();

  if (error) return { error: error.message };

  // Every project gets a conversation on creation. Clients cannot open channels
  // themselves (the insert policy is staff-and-admin only, deliberately), so
  // without this a client's Messages tab would be permanently empty with no
  // affordance to fix it. A failure here is not fatal to the project — the
  // channel can be created later from Messages — so the error is swallowed
  // rather than rolling back a project the user asked for.
  await ensureProjectChannel(data.id as string);

  revalidatePath("/admin/projects");
  revalidatePath("/client/projects");
  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return { ok: true, data: { id: data.id as string } };
}

export async function updateProject(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();
  const values = readForm(form);
  const problem = validate(values);
  if (problem) return { error: problem };

  const { error } = await supabase.from("projects").update(values).eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}

export async function setProjectStatus(id: string, status: ProjectStatus): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}

export async function deleteProject(id: string): Promise<Result> {
  const supabase = await createClient();
  // Tasks and milestones cascade at the database. Doing it here as well would
  // be a second definition of the same rule, free to drift from the first.
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/projects");
  revalidatePath("/client/projects");
  return { ok: true };
}
