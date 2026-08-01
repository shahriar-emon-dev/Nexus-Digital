import { createClient } from "./server";
import type { PortalProject, ProjectMilestone } from "@/lib/client-portal";

/**
 * Project reads, mapped into the shape the existing screens already render.
 *
 * Deliberately returns `PortalProject` rather than raw rows: the grid, the
 * roadmap and the overview cards are working, verified UI, and swapping the
 * data source should not require redesigning them. RLS does the scoping, so
 * these take no organisation argument — a client gets their own projects, staff
 * and admins get all of them, decided by policy rather than by a WHERE clause
 * that could be forgotten.
 */

type Row = {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: PortalProject["status"];
  stage: string;
  lead_id: string | null;
  start_date: string | null;
  target_end: string | null;
  budget_total: number;
  budget_spent: number;
  tone: string;
  icon: string;
  featured: boolean;
};

function toPortalProject(row: Row, progress: number): PortalProject {
  return {
    id: row.slug,
    name: row.name,
    description: row.description,
    leadId: row.lead_id ?? "",
    // Team assignment has no table yet, so these are empty rather than
    // invented. They populate when the staffing feature migrates.
    teamIds: [],
    extraTeam: 0,
    status: row.status,
    progress,
    stage: row.stage,
    startDate: row.start_date ?? "",
    targetEnd: row.target_end ?? "",
    budgetSpent: Number(row.budget_spent),
    budgetTotal: Number(row.budget_total),
    tone: row.tone as PortalProject["tone"],
    icon: row.icon as PortalProject["icon"],
    href: `/client/projects/${row.slug}`,
    featured: row.featured,
  };
}

const SELECT =
  "id, slug, name, description, status, stage, lead_id, start_date, target_end," +
  " budget_total, budget_spent, tone, icon, featured";

/**
 * Progress comes from a second query rather than an embedded resource.
 *
 * `project_progress` is a view, and PostgREST resolves embeds through foreign
 * key metadata that a view does not have — asking for `project_progress(...)`
 * inline fails the whole request with "could not find a relationship", taking
 * the project list down with it. The view is RLS-invoker, so this second read
 * is scoped identically.
 */
async function progressByProject(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from("project_progress")
    .select("project_id, progress")
    .in("project_id", ids);

  return Object.fromEntries(
    (data ?? []).map((r) => [r.project_id as string, (r.progress as number) ?? 0])
  );
}

export async function listProjects(): Promise<PortalProject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select(SELECT)
    .order("featured", { ascending: false })
    .order("name");

  const rows = (data ?? []) as unknown as Row[];
  const progress = await progressByProject(supabase, rows.map((r) => r.id));
  return rows.map((r) => toPortalProject(r, progress[r.id] ?? 0));
}

export async function getProjectBySlug(slug: string): Promise<PortalProject | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("projects").select(SELECT).eq("slug", slug).maybeSingle();
  if (!data) return null;

  const row = data as unknown as Row;
  const progress = await progressByProject(supabase, [row.id]);
  return toPortalProject(row, progress[row.id] ?? 0);
}

export async function listMilestones(slug: string): Promise<ProjectMilestone[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_milestones")
    .select("id, phase, title, description, status, due_date, progress, lead_id, projects!inner(slug)")
    .eq("projects.slug", slug)
    .order("display_order");

  return ((data ?? []) as unknown as Array<{
    id: string;
    phase: string;
    title: string;
    description: string;
    status: ProjectMilestone["status"];
    due_date: string | null;
    progress: number | null;
    lead_id: string | null;
  }>).map((m) => ({
    id: m.id,
    projectId: slug,
    phase: m.phase,
    title: m.title,
    description: m.description,
    status: m.status,
    date: m.due_date ?? "",
    progress: m.progress ?? undefined,
    leadId: m.lead_id ?? undefined,
  }));
}

/**
 * Portfolio rollup for the strip under the grid.
 *
 * Every figure is reduced from the rows actually returned, so it can never
 * disagree with the cards above it — the failure mode the previous module had
 * to guard against by hand.
 */
export function portfolioStatsFrom(projects: PortalProject[]) {
  const active = projects.filter((p) => p.status === "Active");
  const budgetTotal = projects.reduce((n, p) => n + p.budgetTotal, 0);
  const budgetSpent = projects.reduce((n, p) => n + p.budgetSpent, 0);
  const avgProgress = active.length
    ? Math.round(active.reduce((n, p) => n + p.progress, 0) / active.length)
    : 0;

  return {
    total: projects.length,
    activeCount: active.length,
    completed: projects.filter((p) => p.status === "Completed").length,
    totalValue: budgetTotal,
    budgetSpent,
    budgetRemaining: budgetTotal - budgetSpent,
    avgEfficiency: avgProgress,
  };
}
