import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * The admin landing page's figures.
 *
 * Every number this replaces was a literal in the JSX: a "$2,140,000 Active
 * Pipeline" up "18% from previous quarter", "42 Units" of talent overhead,
 * and health bars reading 94% / 78% / 4.9. The file imported nothing from
 * Supabase at all, so the first screen an administrator saw was fiction.
 *
 * The rule applied here is the one used across the rest of the admin: a figure
 * is measured, derived, or absent. Where the database cannot answer a question
 * yet, the card returns null and the page omits it rather than guessing.
 */

export type AdminSummaryCard = {
  id: string;
  title: string;
  value: string;
  note: string | null;
  icon: "pipeline" | "people" | "projects" | "revenue";
};

export type AdminHealthBar = {
  label: string;
  /** Null when nothing measurable exists yet; the bar renders as "No data". */
  percent: number | null;
  display: string;
  basis: string;
};

export type AdminDashboard = {
  summary: AdminSummaryCard[];
  health: AdminHealthBar[];
};

/** One bar on the revenue chart. */
export type RevenuePoint = {
  label: string;
  /** Cash actually collected in the period, in whole currency units. */
  value: number;
  /** Marks the period in progress, which gets the highlight. */
  current?: boolean;
};

export type RevenueSeries = {
  points: RevenuePoint[];
  /** False when nothing has ever been collected; the chart yields to a note. */
  hasData: boolean;
  basis: string;
};

/**
 * Revenue actually collected, by month, over a trailing window.
 *
 * Replaces a hardcoded array — Jan 84k through Jun 104k, roughly $628k of
 * invented revenue — that sat on `/admin`, the first screen an administrator
 * sees, over an `invoice_payments` table containing zero rows. Everything else
 * on that page was correctly wired to real queries, which made the one fake
 * chart worse rather than better: it borrowed their credibility.
 *
 * Payments, not invoices, because "revenue" on a dashboard means money received
 * — an issued invoice is a claim, not income. Each payment is attributed to the
 * month it was PAID rather than the month its invoice was raised, so the
 * series answers "what came in" instead of "what we hoped would".
 *
 * Months with no payments stay in the series as real zeros rather than being
 * dropped: a gap in a time series is information, and closing it would compress
 * a bad quarter into a shorter, healthier-looking chart.
 */
export async function getRevenueSeries(months = 6): Promise<RevenueSeries> {
  noStore();
  const supabase = await createClient();

  const now = new Date();
  // The window is built first so empty months exist as buckets, rather than
  // being inferred from whatever data happens to come back.
  const buckets: { key: string; label: string; value: number; current: boolean }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    buckets.push({
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d),
      value: 0,
      current: i === 0,
    });
  }

  const from = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (months - 1), 1)
  ).toISOString();

  // Void invoices are excluded: a payment against a cancelled invoice is a
  // refund case, not revenue.
  const { data: payments } = await supabase
    .from("invoice_payments")
    .select("amount, paid_at, invoice:invoices ( status )")
    .gte("paid_at", from);

  const index = new Map(buckets.map((b, i) => [b.key, i]));
  let total = 0;

  for (const row of (payments ?? []) as unknown as {
    amount: number | string;
    paid_at: string;
    invoice: { status: string } | null;
  }[]) {
    if (row.invoice?.status === "void") continue;
    const at = index.get(String(row.paid_at).slice(0, 7));
    if (at === undefined) continue;
    const amount = Number(row.amount) || 0;
    buckets[at].value += amount;
    total += amount;
  }

  return {
    points: buckets.map(({ label, value, current }) => ({
      label,
      value: Math.round(value),
      current,
    })),
    hasData: total > 0,
    basis: "Payments received, excluding voided invoices.",
  };
}

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);

export async function getAdminDashboard(): Promise<AdminDashboard> {
  noStore();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: pipeline },
    { count: staffCount },
    { data: projects },
    { data: invoices },
    { data: milestones },
  ] = await Promise.all([
    // The lead pipeline view already computes open value and conversion.
    supabase.from("lead_pipeline").select("*").maybeSingle(),
    supabase.from("staff_profiles").select("id", { count: "exact", head: true }),
    supabase.from("projects").select("id, status, target_end"),
    supabase.from("invoices").select("id, status, due_date"),
    supabase.from("project_milestones").select("id, status, due_date"),
  ]);

  const activeProjects = (projects ?? []).filter((p) => p.status === "Active").length;

  let collected = 0;
  const invoiceIds = (invoices ?? []).map((i) => i.id);
  if (invoiceIds.length > 0) {
    const { data: totals } = await supabase
      .from("invoice_totals")
      .select("invoice_id, paid")
      .in("invoice_id", invoiceIds);
    collected = (totals ?? []).reduce((sum, t) => sum + Number(t.paid ?? 0), 0);
  }

  const summary: AdminSummaryCard[] = [
    {
      id: "pipeline",
      title: "Open Pipeline",
      value: money(Number(pipeline?.open_value ?? 0)),
      note:
        Number(pipeline?.unsized_count ?? 0) > 0
          ? `${pipeline?.unsized_count} lead${Number(pipeline?.unsized_count) === 1 ? "" : "s"} not yet sized`
          : null,
      icon: "pipeline",
    },
    {
      id: "people",
      title: "Team",
      value: `${staffCount ?? 0} ${staffCount === 1 ? "person" : "people"}`,
      note: null,
      icon: "people",
    },
    {
      id: "projects",
      title: "Active Projects",
      value: String(activeProjects),
      note:
        (projects ?? []).length > activeProjects
          ? `${(projects ?? []).length - activeProjects} not active`
          : null,
      icon: "projects",
    },
    {
      id: "revenue",
      title: "Collected",
      value: money(collected),
      note: collected === 0 && invoiceIds.length === 0 ? "No invoices issued yet" : null,
      icon: "revenue",
    },
  ];

  // On-time delivery over milestones that have actually been decided. Counting
  // upcoming ones as failures would move the figure every time work is planned.
  const dated = (milestones ?? []).filter((m) => m.due_date);
  const decided = dated.filter((m) => m.status === "done" || m.due_date! < today);
  const doneOnSchedule = decided.filter((m) => m.status === "done").length;

  const openInvoices = (invoices ?? []).filter((i) => i.status !== "paid" && i.status !== "void");
  const overdue = openInvoices.filter((i) => i.due_date && i.due_date < today).length;

  const health: AdminHealthBar[] = [
    {
      label: "Milestones delivered",
      percent: decided.length > 0 ? Math.round((doneOnSchedule / decided.length) * 100) : null,
      display:
        decided.length > 0
          ? `${doneOnSchedule}/${decided.length}`
          : "No milestones due yet",
      basis: "Completed against milestones whose date has passed.",
    },
    {
      label: "Projects on the board",
      percent:
        (projects ?? []).length > 0
          ? Math.round((activeProjects / (projects ?? []).length) * 100)
          : null,
      display:
        (projects ?? []).length > 0
          ? `${activeProjects}/${(projects ?? []).length}`
          : "No projects yet",
      basis: "Active as a share of every project on record.",
    },
    {
      label: "Invoices settled",
      percent:
        (invoices ?? []).length > 0
          ? Math.round((((invoices ?? []).length - openInvoices.length) / (invoices ?? []).length) * 100)
          : null,
      display:
        (invoices ?? []).length > 0
          ? `${(invoices ?? []).length - openInvoices.length}/${(invoices ?? []).length}${overdue > 0 ? ` · ${overdue} overdue` : ""}`
          : "No invoices issued yet",
      basis: "Paid or voided as a share of every invoice raised.",
    },
  ];

  return { summary, health };
}
