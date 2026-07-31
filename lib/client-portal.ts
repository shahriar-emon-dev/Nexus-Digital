/**
 * Data behind the client portal overview.
 *
 * Project leads reference `lib/team.ts` by id rather than repeating names, and
 * the account is Northwind Retail — the same client that appears in the admin
 * directory and the sidebar — so no surface invents a second version of it.
 * Shaped for the eventual `Client` / `Project` / `Message` / `Meeting` tables.
 */
import { billingSummary, money } from "./invoices";
import { nextMeeting, relativeDay } from "./meetings";
import {
  attachmentOf,
  chatMessages,
  CLIENT_AUTHOR,
  previewOf,
  totalUnread,
} from "./messages";
import type { TeamMember } from "./team";

export type ClientAccount = {
  id: string;
  name: string;
  tier: string;
  /** 0–100. Owned here so only one surface renders it. */
  healthScore: number;
  healthBasis: string;
  welcome: string;
};

export const clientAccount: ClientAccount = {
  id: "northwind",
  name: "Northwind Retail",
  tier: "Premium Tier",
  healthScore: 96,
  healthBasis:
    "Based on 100% on-time payments, 98% milestone velocity, and high engagement frequency.",
  welcome:
    "Your enterprise digital ecosystem is performing at peak efficiency. All major benchmarks for Q4 delivery are currently exceeding baseline projections.",
};

export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Archived";

/** Badge variant per status. Kept as plain strings so `lib/` imports no components. */
export const projectStatusTone: Record<
  ProjectStatus,
  "success" | "warning" | "info" | "default"
> = {
  Active: "success",
  "On Hold": "warning",
  Completed: "info",
  Archived: "default",
};

export type PortalProject = {
  id: string;
  name: string;
  /** Long form, used on the projects index. */
  description: string;
  leadId: TeamMember["id"];
  /** Everyone on the project, lead included. */
  teamIds: TeamMember["id"][];
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

export const portalProjects: PortalProject[] = [
  {
    id: "site-rebuild",
    name: "Site Rebuild",
    description:
      "Next-gen headless storefront with server-rendered catalogue pages and biometric checkout verification.",
    leadId: "sarah-chen",
    teamIds: ["sarah-chen", "alex-vance", "marcus-thorne"],
    extraTeam: 4,
    status: "Active",
    progress: 68,
    stage: "Sprint 3: Frontend Integration",
    startDate: "2026-01-12",
    targetEnd: "2026-10-28",
    budgetSpent: 142_000,
    budgetTotal: 180_000,
    tone: "brand",
    icon: "bank",
    href: "/client/projects/site-rebuild",
    featured: true,
  },
  {
    id: "paid-media",
    name: "Paid Media Q4",
    description:
      "Margin-weighted bidding across search, social and retail media with server-side conversion tracking.",
    leadId: "elara-kent",
    teamIds: ["elara-kent", "alex-vance"],
    extraTeam: 0,
    status: "On Hold",
    progress: 42,
    stage: "Data Training Set Validation",
    startDate: "2026-03-05",
    targetEnd: "2026-12-15",
    budgetSpent: 58_000,
    budgetTotal: 250_000,
    tone: "ion",
    icon: "chart",
    href: "/client/projects/paid-media",
  },
  {
    id: "brand-refresh",
    name: "Brand Refresh",
    description:
      "Identity system, motion language and a component library that scales across every owned surface.",
    leadId: "marcus-thorne",
    teamIds: ["marcus-thorne", "sarah-chen", "elara-kent"],
    extraTeam: 1,
    status: "Active",
    progress: 85,
    stage: "UAT & Deployment Prep",
    startDate: "2026-02-18",
    targetEnd: "2026-08-30",
    budgetSpent: 89_000,
    budgetTotal: 120_000,
    tone: "orchid",
    icon: "store",
    href: "/client/projects/brand-refresh",
  },
  {
    id: "analytics-rebuild",
    name: "Analytics Rebuild",
    description:
      "First-party measurement stack with warehouse-native attribution and board-ready reporting.",
    leadId: "elara-kent",
    teamIds: ["elara-kent", "sarah-chen"],
    extraTeam: 0,
    status: "Completed",
    progress: 100,
    stage: "Handover complete",
    startDate: "2025-09-01",
    targetEnd: "2026-02-14",
    budgetSpent: 64_000,
    budgetTotal: 64_000,
    tone: "brand",
    icon: "chart",
    href: "/client/projects/analytics-rebuild",
  },
  {
    id: "legacy-portal",
    name: "Legacy Portal Migration",
    description:
      "Decommissioned after the storefront rebuild absorbed its remaining scope.",
    leadId: "alex-vance",
    teamIds: ["alex-vance"],
    extraTeam: 0,
    status: "Archived",
    progress: 100,
    stage: "Closed",
    startDate: "2025-04-10",
    targetEnd: "2025-11-30",
    budgetSpent: 31_500,
    budgetTotal: 45_000,
    tone: "ion",
    icon: "shield",
    href: "/client/projects/legacy-portal",
  },
];

/** Derived so the filter tabs can never offer an empty bucket. */
export const projectStatuses: ProjectStatus[] = [
  ...new Set(portalProjects.map((p) => p.status)),
];

/**
 * Work currently in flight — what the overview's velocity section shows, and
 * what its "Active Projects" KPI counts. Both read this so the number and the
 * card count can never disagree.
 */
export const inFlightProjects = portalProjects.filter(
  (p) => p.status === "Active" || p.status === "On Hold"
);

/** Footer strip on the projects index. Derived, not hand-typed. */
export const portfolioStats = {
  totalValue: portalProjects.reduce((sum, p) => sum + p.budgetTotal, 0),
  activeCount: portalProjects.filter((p) => p.status === "Active").length,
  avgEfficiency: Math.round(
    portalProjects.reduce((sum, p) => sum + p.progress, 0) / portalProjects.length
  ),
};

/** Lookup for the detail route. */
export const projectById = (id: string) => portalProjects.find((p) => p.id === id);

// ── Milestones ──────────────────────────────────────────────────────────────

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
  leadId?: TeamMember["id"];
};

/**
 * Flat with a `projectId`, the way a `Milestone` table joins back.
 *
 * Invariant worth preserving when editing: a project's `progress` is the
 * milestone rollup — `(completed + activeFraction) / total`. Site Rebuild is
 * (3 + 0.40) / 5 = 68%, matching its 68 above. Keep them in step or the
 * roadmap and the overview card will quote different numbers.
 */
export const projectMilestones: ProjectMilestone[] = [
  // ── Site Rebuild ──
  {
    id: "sr-1",
    projectId: "site-rebuild",
    phase: "Phase 1",
    title: "Discovery & Audit",
    description:
      "Deep-dive research into existing market positioning and brand equity analysis.",
    status: "done",
    date: "2026-02-20",
  },
  {
    id: "sr-2",
    projectId: "site-rebuild",
    phase: "Phase 2",
    title: "Visual Identity V1",
    description:
      "Conceptualisation of core palette, typography, and primary brand assets.",
    status: "done",
    date: "2026-04-03",
  },
  {
    id: "sr-3",
    projectId: "site-rebuild",
    phase: "Phase 3",
    title: "Commerce Data Layer",
    description:
      "Catalogue schema, inventory sync, and the server-rendered product pipeline.",
    status: "done",
    date: "2026-06-12",
  },
  {
    id: "sr-4",
    projectId: "site-rebuild",
    phase: "Phase 4",
    title: "Frontend Integration",
    description:
      "Current sprint focuses on high-fidelity prototyping of the primary web experience, including responsive behavioural patterns and advanced glassmorphic styling modules.",
    status: "active",
    date: "2026-08-21",
    progress: 40,
    leadId: "marcus-thorne",
  },
  {
    id: "sr-5",
    projectId: "site-rebuild",
    phase: "Phase 5",
    title: "Final Brand Handover",
    description: "Complete asset package delivery and technical orientation session.",
    status: "final",
    date: "2026-10-28",
  },

  // ── Paid Media Q4 ── (2 + 0.10) / 5 = 42%
  {
    id: "pm-1",
    projectId: "paid-media",
    phase: "Phase 1",
    title: "Channel Audit",
    description: "Baseline spend, incrementality gaps, and creative fatigue mapping.",
    status: "done",
    date: "2026-03-28",
  },
  {
    id: "pm-2",
    projectId: "paid-media",
    phase: "Phase 2",
    title: "Server-Side Tagging",
    description: "First-party conversion pipeline with consent-aware event forwarding.",
    status: "done",
    date: "2026-05-16",
  },
  {
    id: "pm-3",
    projectId: "paid-media",
    phase: "Phase 3",
    title: "Data Training Set Validation",
    description:
      "Paused pending your finance team's sign-off on the margin table feeding the bid model.",
    status: "active",
    date: "2026-09-04",
    progress: 10,
    leadId: "elara-kent",
  },
  {
    id: "pm-4",
    projectId: "paid-media",
    phase: "Phase 4",
    title: "Margin-Weighted Bidding",
    description: "Rollout across search, social, and retail media with guardrail budgets.",
    status: "upcoming",
    date: "2026-11-06",
  },
  {
    id: "pm-5",
    projectId: "paid-media",
    phase: "Phase 5",
    title: "Playbook & Training",
    description: "Operating manual and two live sessions with your growth team.",
    status: "final",
    date: "2026-12-15",
  },

  // ── Brand Refresh ── (4 + 0.25) / 5 = 85%
  {
    id: "br-1",
    projectId: "brand-refresh",
    phase: "Phase 1",
    title: "Positioning Workshops",
    description: "Stakeholder interviews and competitive territory mapping.",
    status: "done",
    date: "2026-03-11",
  },
  {
    id: "br-2",
    projectId: "brand-refresh",
    phase: "Phase 2",
    title: "Identity System",
    description: "Wordmark, palette, and the typographic scale across all breakpoints.",
    status: "done",
    date: "2026-04-24",
  },
  {
    id: "br-3",
    projectId: "brand-refresh",
    phase: "Phase 3",
    title: "Motion Language",
    description: "Easing curves, duration scale, and reduced-motion equivalents.",
    status: "done",
    date: "2026-06-05",
  },
  {
    id: "br-4",
    projectId: "brand-refresh",
    phase: "Phase 4",
    title: "Component Library",
    description: "Production components covering every owned surface.",
    status: "done",
    date: "2026-07-17",
  },
  {
    id: "br-5",
    projectId: "brand-refresh",
    phase: "Phase 5",
    title: "UAT & Deployment Prep",
    description: "Final acceptance pass, then the guidelines site goes live.",
    status: "active",
    date: "2026-08-30",
    progress: 25,
    leadId: "marcus-thorne",
  },

  // ── Analytics Rebuild ── 4 / 4 = 100%
  {
    id: "ar-1",
    projectId: "analytics-rebuild",
    phase: "Phase 1",
    title: "Measurement Plan",
    description: "Event taxonomy and the metric tree the board reports against.",
    status: "done",
    date: "2025-10-14",
  },
  {
    id: "ar-2",
    projectId: "analytics-rebuild",
    phase: "Phase 2",
    title: "Warehouse Pipeline",
    description: "Ingestion, modelling, and identity resolution in the warehouse.",
    status: "done",
    date: "2025-12-02",
  },
  {
    id: "ar-3",
    projectId: "analytics-rebuild",
    phase: "Phase 3",
    title: "Attribution Model",
    description: "Warehouse-native attribution validated against a holdout test.",
    status: "done",
    date: "2026-01-20",
  },
  {
    id: "ar-4",
    projectId: "analytics-rebuild",
    phase: "Phase 4",
    title: "Reporting Handover",
    description: "Dashboards, runbook, and ownership transfer to your data team.",
    status: "done",
    date: "2026-02-14",
  },

  // ── Legacy Portal Migration ── 3 / 3 = 100%
  {
    id: "lp-1",
    projectId: "legacy-portal",
    phase: "Phase 1",
    title: "Dependency Audit",
    description: "Mapped every downstream consumer of the legacy portal APIs.",
    status: "done",
    date: "2025-06-18",
  },
  {
    id: "lp-2",
    projectId: "legacy-portal",
    phase: "Phase 2",
    title: "Data Extraction",
    description: "Historic records exported and reconciled against the new schema.",
    status: "done",
    date: "2025-09-09",
  },
  {
    id: "lp-3",
    projectId: "legacy-portal",
    phase: "Phase 3",
    title: "Decommission",
    description:
      "Scope absorbed by the storefront rebuild; remaining budget released back.",
    status: "done",
    date: "2025-11-30",
  },
];

export const milestonesFor = (projectId: string) =>
  projectMilestones.filter((m) => m.projectId === projectId);

// ── Kanban board ────────────────────────────────────────────────────────────

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
  assigneeId: TeamMember["id"];
  description?: string;
  /** Review column only — surfaces the approve action to the client. */
  awaitingApproval?: boolean;
  priority?: boolean;
};

export const boardTasks: BoardTask[] = [
  // ── Site Rebuild ──
  {
    id: "sr-t1",
    projectId: "site-rebuild",
    column: "backlog",
    title: "Draft Design Token Architecture",
    discipline: "Research",
    assigneeId: "marcus-thorne",
  },
  {
    id: "sr-t2",
    projectId: "site-rebuild",
    column: "backlog",
    title: "Accessibility Audit v1",
    discipline: "QA",
    assigneeId: "alex-vance",
  },
  {
    id: "sr-t3",
    projectId: "site-rebuild",
    column: "backlog",
    title: "Icon System Expansion",
    discipline: "Design",
    assigneeId: "marcus-thorne",
  },
  {
    id: "sr-t4",
    projectId: "site-rebuild",
    column: "in-progress",
    title: "Checkout Animation Physics",
    discipline: "Dev",
    assigneeId: "sarah-chen",
  },
  {
    id: "sr-t5",
    projectId: "site-rebuild",
    column: "in-progress",
    title: "Fluid Catalogue Grid",
    discipline: "UI",
    assigneeId: "marcus-thorne",
  },
  {
    id: "sr-t6",
    projectId: "site-rebuild",
    column: "review",
    title: "Storefront Component Library",
    description:
      "Complete set of buttons, cards, and input fields with obsidian styling ready for stakeholder approval.",
    discipline: "UI",
    assigneeId: "marcus-thorne",
    awaitingApproval: true,
    priority: true,
  },
  {
    id: "sr-t7",
    projectId: "site-rebuild",
    column: "review",
    title: "Brand Styleguide v2.1",
    description:
      "Updated colour palette and typography scale incorporating your feedback from phase 1.",
    discipline: "Design",
    assigneeId: "marcus-thorne",
    awaitingApproval: true,
  },
  {
    id: "sr-t8",
    projectId: "site-rebuild",
    column: "done",
    title: "Information Architecture",
    discipline: "UX",
    assigneeId: "elara-kent",
  },
  {
    id: "sr-t9",
    projectId: "site-rebuild",
    column: "done",
    title: "Stakeholder Workshops",
    discipline: "Mgmt",
    assigneeId: "sarah-chen",
  },
  {
    id: "sr-t10",
    projectId: "site-rebuild",
    column: "done",
    title: "Inventory Sync Contract",
    discipline: "Dev",
    assigneeId: "alex-vance",
  },
  {
    id: "sr-t11",
    projectId: "site-rebuild",
    column: "done",
    title: "Biometric Checkout Spike",
    discipline: "Dev",
    assigneeId: "sarah-chen",
  },

  // ── Paid Media Q4 ──
  {
    id: "pm-t1",
    projectId: "paid-media",
    column: "backlog",
    title: "Retail Media Feed Mapping",
    discipline: "Ops",
    assigneeId: "elara-kent",
  },
  {
    id: "pm-t2",
    projectId: "paid-media",
    column: "in-progress",
    title: "Holdout Test Design",
    discipline: "Analytics",
    assigneeId: "elara-kent",
  },
  {
    id: "pm-t3",
    projectId: "paid-media",
    column: "review",
    title: "Margin Table Sign-Off",
    description:
      "Bid model needs your finance team to confirm per-SKU margins before training resumes.",
    discipline: "Finance",
    assigneeId: "elara-kent",
    awaitingApproval: true,
    priority: true,
  },
  {
    id: "pm-t4",
    projectId: "paid-media",
    column: "done",
    title: "Server-Side Tag Rollout",
    discipline: "Dev",
    assigneeId: "alex-vance",
  },
  {
    id: "pm-t5",
    projectId: "paid-media",
    column: "done",
    title: "Creative Fatigue Analysis",
    discipline: "Analytics",
    assigneeId: "elara-kent",
  },

  // ── Brand Refresh ──
  {
    id: "br-t1",
    projectId: "brand-refresh",
    column: "in-progress",
    title: "Guidelines Site Build",
    discipline: "Dev",
    assigneeId: "sarah-chen",
  },
  {
    id: "br-t2",
    projectId: "brand-refresh",
    column: "review",
    title: "Final Logo Lockups",
    description: "Horizontal, stacked, and monogram variants across all clear-space rules.",
    discipline: "Design",
    assigneeId: "marcus-thorne",
    awaitingApproval: true,
    priority: true,
  },
  {
    id: "br-t3",
    projectId: "brand-refresh",
    column: "done",
    title: "Motion Spec",
    discipline: "Design",
    assigneeId: "marcus-thorne",
  },
  {
    id: "br-t4",
    projectId: "brand-refresh",
    column: "done",
    title: "Typographic Scale",
    discipline: "Design",
    assigneeId: "marcus-thorne",
  },
  {
    id: "br-t5",
    projectId: "brand-refresh",
    column: "done",
    title: "Component Library v1",
    discipline: "UI",
    assigneeId: "marcus-thorne",
  },

  // ── Analytics Rebuild ──
  {
    id: "ar-t1",
    projectId: "analytics-rebuild",
    column: "done",
    title: "Event Taxonomy",
    discipline: "Analytics",
    assigneeId: "elara-kent",
  },
  {
    id: "ar-t2",
    projectId: "analytics-rebuild",
    column: "done",
    title: "Warehouse Models",
    discipline: "Dev",
    assigneeId: "sarah-chen",
  },
  {
    id: "ar-t3",
    projectId: "analytics-rebuild",
    column: "done",
    title: "Attribution Validation",
    discipline: "Analytics",
    assigneeId: "elara-kent",
  },

  // ── Legacy Portal Migration ──
  {
    id: "lp-t1",
    projectId: "legacy-portal",
    column: "done",
    title: "Dependency Map",
    discipline: "Ops",
    assigneeId: "alex-vance",
  },
  {
    id: "lp-t2",
    projectId: "legacy-portal",
    column: "done",
    title: "Historic Data Export",
    discipline: "Dev",
    assigneeId: "alex-vance",
  },
];

export const boardFor = (projectId: string) =>
  boardTasks.filter((t) => t.projectId === projectId);

/**
 * Elapsed share of the schedule, for the pulse rail. Clamped, because a project
 * past its target date should read 100% rather than overflow the track.
 */
export function scheduleElapsed(project: PortalProject, now = new Date()) {
  const start = new Date(project.startDate).getTime();
  const end = new Date(project.targetEnd).getTime();
  const days = Math.max(0, Math.round((now.getTime() - start) / 86_400_000));
  const total = Math.max(1, Math.round((end - start) / 86_400_000));
  return { days, total, percent: Math.min(100, Math.round((days / total) * 100)) };
}

export type PortalMessage = {
  id: string;
  authorId: TeamMember["id"];
  time: string;
  preview: string;
  attachment?: string;
};

/**
 * The overview's "Recent Communications" card. Derived from `lib/messages.ts`
 * rather than a second hand-written list, so the preview text always matches
 * what the messages surface actually shows.
 *
 * Only staff messages appear — the card is about what the agency has said to
 * the client, so echoing the client's own replies back at them adds nothing.
 */
export const portalMessages: PortalMessage[] = chatMessages
  .filter((m) => m.authorId !== CLIENT_AUTHOR)
  .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
  .slice(0, 3)
  .map((m) => ({
    id: m.id,
    authorId: m.authorId as TeamMember["id"],
    time: new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      day: "numeric",
    }).format(new Date(m.sentAt)),
    preview: previewOf(m),
    attachment: attachmentOf(m),
  }));

export type PortalMeeting = {
  title: string;
  when: string;
  durationMinutes: number;
  attendeeIds: TeamMember["id"][];
  extraAttendees: number;
};

/**
 * The overview's meeting card. Derived from `lib/meetings.ts` so the card and
 * the meetings page always name the same next meeting — the `when` string used
 * to be hand-written and drifted the moment the schedule changed.
 */
export const upcomingMeeting: PortalMeeting = {
  title: nextMeeting.title,
  when:
    relativeDay(nextMeeting.startsAt) ??
    new Intl.DateTimeFormat("en-US", { weekday: "long", month: "short", day: "numeric" }).format(
      new Date(nextMeeting.startsAt)
    ),
  durationMinutes: nextMeeting.durationMinutes,
  attendeeIds: nextMeeting.attendeeIds,
  extraAttendees: nextMeeting.extraAttendees,
};

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

export const portalKpis: PortalKpi[] = [
  {
    id: "projects",
    label: "Active Projects",
    value: `${inFlightProjects.length} Projects`,
    icon: "projects",
    tone: "brand",
    href: "/client/projects",
  },
  {
    id: "milestone",
    label: "Next Milestone",
    value: "API Integration Layer",
    note: "4 Days Remaining",
    icon: "milestone",
    tone: "ion",
    badge: { label: "Due soon", tone: "danger" },
  },
  {
    id: "messages",
    label: "Unread Messages",
    value: `${totalUnread} Messages`,
    icon: "messages",
    tone: "orchid",
    href: "/client/messages",
  },
  {
    id: "billing",
    label: "Billing Status",
    // Derived from the invoice ledger, so the overview and the billing table
    // can never quote different balances.
    value: money.format(billingSummary.outstanding),
    icon: "billing",
    tone: "brand",
    emphasis: true,
    action: { label: "Pay Now", href: "/client/invoices" },
  },
];
