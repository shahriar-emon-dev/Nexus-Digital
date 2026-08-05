/**
 * Pure reducers and constants shared by the admin screens.
 *
 * These live outside the `"use server"` action modules for a hard reason: a
 * file marked `"use server"` may only export async functions, because every
 * export becomes a callable server endpoint. A synchronous reducer in one of
 * those files fails the build with "Server actions must be async functions".
 *
 * Keeping them here also makes the important property visible: every figure a
 * dashboard tile shows is reduced from the same array the table beneath it
 * renders, so a tile cannot disagree with the rows it summarises.
 */

import type { AdminInvoice } from "./supabase/invoice-actions";
import type { AdminProject } from "./supabase/project-actions";
import type { ClientAccount } from "./supabase/client-actions";
import type { Credential } from "./supabase/credential-actions";
import type { ReviewWithContext } from "./supabase/review-actions";
import type { StaffMember } from "./supabase/staff-actions";
import type { TrackedKeyword } from "./supabase/seo-actions";

/* --------------------------------------------------------------- reviews -- */

export type ReviewStats = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  /** Null rather than 0 when nothing is approved — an empty wall has no score. */
  averageRating: number | null;
};

export function reviewStatsFrom(reviews: ReviewWithContext[]): ReviewStats {
  const approved = reviews.filter((r) => r.status === "approved");
  return {
    total: reviews.length,
    pending: reviews.filter((r) => r.status === "pending").length,
    approved: approved.length,
    rejected: reviews.filter((r) => r.status === "rejected").length,
    averageRating: approved.length
      ? Math.round((approved.reduce((n, r) => n + r.rating, 0) / approved.length) * 10) / 10
      : null,
  };
}

/* ----------------------------------------------------------- credentials -- */

/** Prefix hints, so the add form can say what a key should start with. */
export const KNOWN_PROVIDERS = [
  { name: "Stripe", prefix: "sk_live_", docs: "https://stripe.com/docs/keys" },
  { name: "OpenAI", prefix: "sk-", docs: "https://platform.openai.com/api-keys" },
  { name: "Anthropic", prefix: "sk-ant-", docs: "https://console.anthropic.com/settings/keys" },
  { name: "Google", prefix: "AIza", docs: "https://developers.google.com" },
  { name: "AWS", prefix: "AKIA", docs: "https://docs.aws.amazon.com/iam" },
  { name: "Resend", prefix: "re_", docs: "https://resend.com/docs" },
  { name: "Supabase", prefix: "sb_", docs: "https://supabase.com/docs" },
] as const;

export type CredentialStats = {
  total: number;
  enabled: number;
  production: number;
  overdue: number;
  dueSoon: number;
};

export function credentialStatsFrom(credentials: Credential[]): CredentialStats {
  return {
    total: credentials.length,
    enabled: credentials.filter((c) => c.is_enabled).length,
    production: credentials.filter((c) => c.environment === "production").length,
    overdue: credentials.filter((c) => c.rotation.state === "overdue").length,
    dueSoon: credentials.filter((c) => c.rotation.state === "due-soon").length,
  };
}

/* -------------------------------------------------------------- projects -- */

export type ProjectPortfolio = {
  total: number;
  active: number;
  completed: number;
  onHold: number;
  budgetTotal: number;
  budgetSpent: number;
  /** Null when nothing is active — an average of no projects is not zero. */
  averageProgress: number | null;
};

export function portfolioFrom(projects: AdminProject[]): ProjectPortfolio {
  const active = projects.filter((p) => p.status === "Active");
  return {
    total: projects.length,
    active: active.length,
    completed: projects.filter((p) => p.status === "Completed").length,
    onHold: projects.filter((p) => p.status === "On Hold").length,
    budgetTotal: projects.reduce((n, p) => n + Number(p.budget_total), 0),
    budgetSpent: projects.reduce((n, p) => n + Number(p.budget_spent), 0),
    averageProgress: active.length
      ? Math.round(active.reduce((n, p) => n + p.progress, 0) / active.length)
      : null,
  };
}

/* -------------------------------------------------------------- invoices -- */

export type InvoiceSummary = {
  count: number;
  billed: number;
  collected: number;
  outstanding: number;
  overdue: number;
  overdueCount: number;
  draftCount: number;
};

export function summariseInvoices(invoices: AdminInvoice[]): InvoiceSummary {
  // Void invoices are excluded from every money figure: a cancelled invoice
  // that still counts toward revenue is an accounting error, not a rounding one.
  const live = invoices.filter((i) => i.status !== "void");
  const late = live.filter((i) => i.isOverdue);

  return {
    count: invoices.length,
    billed: live.reduce((n, i) => n + i.totals.total, 0),
    collected: live.reduce((n, i) => n + i.totals.paid, 0),
    outstanding: live.reduce((n, i) => n + i.totals.outstanding, 0),
    overdue: late.reduce((n, i) => n + i.totals.outstanding, 0),
    overdueCount: late.length,
    draftCount: invoices.filter((i) => i.status === "draft").length,
  };
}

/* ----------------------------------------------------------------- staff -- */

export type AllocationSummary = {
  headcount: number;
  /** Null when nobody has capacity recorded — 0% would read as "nobody works". */
  globalUtilisation: number | null;
  totalCapacity: number;
  totalAssigned: number;
  overbooked: number;
  underutilised: number;
  unscheduled: number;
};

export function allocationFrom(staff: StaffMember[]): AllocationSummary {
  const withCapacity = staff.filter((s) => s.utilisation.capacityHours > 0);
  const totalCapacity = withCapacity.reduce((n, s) => n + s.utilisation.capacityHours, 0);
  const totalAssigned = withCapacity.reduce((n, s) => n + s.utilisation.assignedHours, 0);

  return {
    headcount: staff.length,
    globalUtilisation: totalCapacity > 0 ? Math.round((totalAssigned / totalCapacity) * 100) : null,
    totalCapacity,
    totalAssigned,
    overbooked: staff.filter((s) => (s.utilisation.pct ?? 0) > 100).length,
    underutilised: staff.filter(
      (s) => s.utilisation.assignedHours > 0 && (s.utilisation.pct ?? 0) < 60
    ).length,
    unscheduled: staff.filter((s) => s.utilisation.assignedHours === 0).length,
  };
}

/* --------------------------------------------------------------- clients -- */

export function clientSummaryFrom(clients: ClientAccount[]) {
  return {
    total: clients.length,
    atRisk: clients.filter((c) => c.health === "at-risk").length,
    monthly: clients.reduce((n, c) => n + c.revenue.monthlyAverage, 0),
    outstanding: clients.reduce((n, c) => n + c.revenue.outstanding, 0),
  };
}

/* ------------------------------------------------------------------- seo -- */

export type KeywordSummary = {
  tracked: number;
  measured: number;
  topTen: number;
  improved: number;
  declined: number;
  /** Null when nothing is measured — an average of no ranks is not zero. */
  averagePosition: number | null;
};

export function keywordSummaryFrom(keywords: TrackedKeyword[]): KeywordSummary {
  const measured = keywords.filter((k) => k.position !== null);
  return {
    tracked: keywords.length,
    measured: measured.length,
    topTen: measured.filter((k) => (k.position ?? 999) <= 10).length,
    improved: keywords.filter((k) => (k.movement ?? 0) > 0).length,
    declined: keywords.filter((k) => (k.movement ?? 0) < 0).length,
    averagePosition: measured.length
      ? Math.round((measured.reduce((n, k) => n + (k.position ?? 0), 0) / measured.length) * 10) / 10
      : null,
  };
}

/* --------------------------------------------------------------- site seo -- */

/** Recommended lengths, so the character counters mean something. */
export const SEO_LIMITS = { title: 60, description: 155 } as const;

/** Shape of an identifier, used to tell the user why a value was rejected. */
export const ID_PATTERNS = {
  ga4: { pattern: "^G-[A-Z0-9]{6,12}$", hint: "Starts with G- followed by 6–12 characters." },
  gtm: { pattern: "^GTM-[A-Z0-9]{5,9}$", hint: "Starts with GTM- followed by 5–9 characters." },
} as const;
