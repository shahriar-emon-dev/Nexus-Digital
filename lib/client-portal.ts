/**
 * Shapes and pure helpers for the client portal.
 *
 * This module used to carry six static arrays — a fictional account, its
 * projects, milestones, board tasks, messages and KPIs — and thirteen files
 * imported them. Every signed-in client therefore saw the same invented
 * company, including its billing state.
 *
 * The data now comes from Postgres through `lib/supabase/project-queries.ts`
 * and `lib/supabase/account-queries.ts`. What stays here is the vocabulary the
 * screens are written against: the types, the badge tone maps, and the two
 * derivations that are arithmetic rather than content.
 *
 * Nothing in this file may import from `lib/supabase/` — these types are shared
 * by client components, and dragging a server module into that graph would pull
 * server-only code into the browser bundle.
 */

/* ------------------------------------------------------------- projects -- */

export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Archived";

/** Badge variant per status. Plain strings so `lib/` imports no components. */
export const projectStatusTone: Record<
  ProjectStatus,
  "success" | "warning" | "info" | "default"
> = {
  Active: "success",
  "On Hold": "warning",
  Completed: "info",
  Archived: "default",
};

/** Filter options. Fixed because it is the enum, not a sample of the rows. */
export const projectStatuses: ProjectStatus[] = ["Active", "On Hold", "Completed", "Archived"];

export type PortalProject = {
  id: string;
  name: string;
  /** Long form, used on the projects index. */
  description: string;
  leadId: string;
  /** Everyone on the project, lead included. */
  teamIds: string[];
  extraTeam: number;
  status: ProjectStatus;
  progress: number;
  stage: string;
  startDate: string;
  targetEnd: string;
  budgetSpent: number;
  budgetTotal: number;
  tone: "brand" | "ion" | "orchid";
  icon: "bank" | "ai" | "store" | "chart" | "shield";
  href: string;
  /** Only the current focus project carries the rotating beam. */
  featured?: boolean;
};

/**
 * How far through the planned schedule a project is, by elapsed calendar days.
 *
 * Arithmetic on two dates, not a stored figure — which is why it stayed here
 * when the data left. Clamped at 100 so an overrun renders as a full bar rather
 * than overflowing its track.
 */
export function scheduleElapsed(project: PortalProject, now = new Date()) {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetEnd).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return { days: 0, total: 1, percent: 0 };
  }
  const days = Math.max(0, Math.round((now.getTime() - start) / 86_400_000));
  const total = Math.max(1, Math.round((end - start) / 86_400_000));
  return { days, total, percent: Math.min(100, Math.round((days / total) * 100)) };
}

/* ----------------------------------------------------------- milestones -- */

export type MilestoneStatus = "done" | "active" | "upcoming" | "final";

export type ProjectMilestone = {
  id: string;
  projectId: PortalProject["id"];
  phase: string;
  title: string;
  description: string;
  status: MilestoneStatus;
  /** Completion date when done, target date otherwise. */
  date: string;
  /** Percent through this phase. Only the `active` milestone carries one. */
  progress?: number;
  leadId?: string;
};

/* ---------------------------------------------------------------- board -- */

export type BoardColumnId = "backlog" | "in-progress" | "review" | "done";

export type BoardColumn = {
  id: BoardColumnId;
  title: string;
  tone: "neutral" | "ion" | "brand" | "orchid";
};

/** Left-to-right column order. Read-only for the client — no drag target. */
export const boardColumns: BoardColumn[] = [
  { id: "backlog", title: "Backlog", tone: "neutral" },
  { id: "in-progress", title: "In Progress", tone: "ion" },
  { id: "review", title: "Review Required", tone: "brand" },
  { id: "done", title: "Completed", tone: "orchid" },
];

export type BoardTask = {
  id: string;
  projectId: PortalProject["id"];
  column: BoardColumnId;
  title: string;
  /** Short discipline chip: RESEARCH, QA, DEV… */
  discipline: string;
  assigneeId: string;
  description?: string;
  /** Review column only — surfaces the approve action to the client. */
  awaitingApproval?: boolean;
  priority?: boolean;
};

/* -------------------------------------------------------------- account -- */

export type ClientAccount = {
  id: string;
  name: string;
  tier: string;
  /**
   * The organisation's recorded health, not a computed score.
   *
   * This was a hardcoded 96 with a note claiming "100% on-time payments, 98%
   * milestone velocity" — two figures nothing measured. `organizations.health`
   * is a real column an account manager sets, so that is what is shown.
   */
  health: "healthy" | "watch" | "at_risk" | null;
  /** Null when nobody has set one. The card hides rather than inventing copy. */
  welcome: string | null;
};

export const healthTone: Record<
  NonNullable<ClientAccount["health"]>,
  { label: string; tone: "success" | "warning" | "danger" }
> = {
  healthy: { label: "Healthy", tone: "success" },
  watch: { label: "Watch", tone: "warning" },
  at_risk: { label: "At risk", tone: "danger" },
};

/* ------------------------------------------------------------------ kpis -- */

export type PortalKpi = {
  id: string;
  label: string;
  value: string;
  /** Optional supporting lines, e.g. milestone name + countdown. */
  detail?: string;
  note?: string;
  icon: "projects" | "milestone" | "messages" | "billing";
  tone: "brand" | "ion" | "orchid";
  href?: string;
  badge?: { label: string; tone: "danger" };
  action?: { label: string; href: string };
  emphasis?: boolean;
};

export type PortalMessage = {
  id: string;
  authorName: string;
  authorAvatar: string | null;
  time: string;
  preview: string;
};

export type PortalMeeting = {
  title: string;
  when: string;
  durationMinutes: number;
  attendees: { id: string; name: string; avatarUrl: string | null }[];
};
