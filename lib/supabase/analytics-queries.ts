import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * The admin analytics engine.
 *
 * Spec §12.1 lists eight charts. Zero existed — `/admin/analytics` redirected
 * to the SEO overview, and the only measured figures anywhere were the four
 * cards on the dashboard.
 *
 * Every series here is COUNTED or DERIVED from a table. Where the database
 * cannot answer a question, the series comes back empty and the page renders a
 * reason rather than a flat line — a chart of zeros reads as a catastrophic
 * quarter, not as an unused feature.
 *
 * Nothing here reaches for GA4 or any external analytics. Spec §12.3 wants web
 * traffic, and this application has no visibility into it: the honest surface
 * for that is the provider's own console until an integration exists, and
 * inventing a "visitors" series from row counts would be worse than its absence.
 */

export type Bar = { label: string; value: number; hint?: string };

export type AnalyticsBundle = {
  revenueByMonth: Bar[];
  clientsByMonth: Bar[];
  leadFunnel: Bar[];
  projectStatus: Bar[];
  accountHealth: Bar[];
  staffUtilisation: Bar[];
  ratingDistribution: Bar[];
  collection: { billed: number; collected: number; outstanding: number; rate: number | null };
  totals: { leads: number; clients: number; projects: number; reviews: number };
};

/** Last `n` months as `{key, label}`, oldest first. */
function monthWindow(n: number) {
  const now = new Date();
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (n - 1 - i), 1));
    return {
      key: `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      label: new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" }).format(d),
    };
  });
}

function bucketByMonth<T extends { at: string | null }>(
  rows: T[],
  months: { key: string; label: string }[],
  valueOf: (row: T) => number = () => 1
): Bar[] {
  const index = new Map(months.map((m, i) => [m.key, i]));
  const out = months.map((m) => ({ label: m.label, value: 0 }));

  for (const row of rows) {
    if (!row.at) continue;
    const at = index.get(String(row.at).slice(0, 7));
    if (at === undefined) continue;
    out[at].value += valueOf(row);
  }
  return out;
}

export async function getAnalytics(months = 12): Promise<AnalyticsBundle> {
  noStore();
  const supabase = await createClient();

  const window = monthWindow(months);
  const from = new Date(
    Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - (months - 1), 1)
  ).toISOString();

  const [
    payments,
    organizations,
    leads,
    projects,
    reviews,
    assignments,
    timeEntries,
    invoices,
  ] = await Promise.all([
    supabase
      .from("invoice_payments")
      .select("amount, paid_at, invoice:invoices ( status )")
      .gte("paid_at", from),
    supabase.from("organizations").select("id, created_at, health"),
    supabase.from("leads").select("id, status, estimated_value"),
    supabase.from("projects").select("id, status"),
    supabase.from("reviews").select("rating").eq("status", "approved"),
    supabase.from("project_assignments").select("profile_id, hours_per_week"),
    supabase.from("time_entries").select("profile_id, minutes"),
    supabase.from("invoices").select("id, status"),
  ]);

  /* ---------------------------------------------------------- revenue --- */
  // Payments, not invoices: an issued invoice is a claim, income is cash in.
  const paymentRows = (payments.data ?? []) as unknown as {
    amount: number | string;
    paid_at: string;
    invoice: { status: string } | null;
  }[];

  const revenueByMonth = bucketByMonth(
    paymentRows
      .filter((p) => p.invoice?.status !== "void")
      .map((p) => ({ at: p.paid_at, amount: Number(p.amount) || 0 })),
    window,
    (r) => r.amount
  ).map((b) => ({ ...b, value: Math.round(b.value) }));

  /* ---------------------------------------------------- client growth --- */
  const orgRows = (organizations.data ?? []) as {
    id: string;
    created_at: string;
    health: string;
  }[];
  const clientsByMonth = bucketByMonth(
    orgRows.map((o) => ({ at: o.created_at })),
    window
  );

  /* ------------------------------------------------------ lead funnel --- */
  // Ordered stages, so this is an ordinal scale rather than nominal categories.
  const leadRows = (leads.data ?? []) as {
    id: string;
    status: string;
    estimated_value: number | null;
  }[];
  const FUNNEL = ["new", "contacted", "qualified", "won"] as const;
  const leadFunnel = FUNNEL.map((stage) => ({
    label: stage[0].toUpperCase() + stage.slice(1),
    value: leadRows.filter((l) => l.status === stage).length,
  }));

  /* -------------------------------------------------- project status --- */
  const projectRows = (projects.data ?? []) as { id: string; status: string }[];
  const projectStatus = ["Active", "On Hold", "Completed", "Archived"].map((s) => ({
    label: s,
    value: projectRows.filter((p) => p.status === s).length,
  }));

  /* ------------------------------------------------- account health --- */
  // Status, not identity — these get the status palette, never categorical hues.
  const accountHealth = ["healthy", "onboarding", "at-risk", "churned"].map((h) => ({
    label: h,
    value: orgRows.filter((o) => o.health === h).length,
  }));

  /* ---------------------------------------------- staff utilisation --- */
  // Logged hours against committed hours. Anyone with no commitment is omitted
  // rather than shown at 0% — an unassigned person is not underperforming.
  const assignmentRows = (assignments.data ?? []) as {
    profile_id: string;
    hours_per_week: number;
  }[];
  const timeRows = (timeEntries.data ?? []) as { profile_id: string; minutes: number }[];

  const committed = new Map<string, number>();
  for (const a of assignmentRows) {
    committed.set(a.profile_id, (committed.get(a.profile_id) ?? 0) + Number(a.hours_per_week));
  }
  const logged = new Map<string, number>();
  for (const t of timeRows) {
    logged.set(t.profile_id, (logged.get(t.profile_id) ?? 0) + Number(t.minutes) / 60);
  }

  let staffUtilisation: Bar[] = [];
  const withCommitment = [...committed.entries()].filter(([, hours]) => hours > 0);
  if (withCommitment.length > 0) {
    const { data: people } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", withCommitment.map(([id]) => id));

    const nameOf = new Map(
      ((people ?? []) as { id: string; full_name: string | null; email: string }[]).map((p) => [
        p.id,
        p.full_name || p.email,
      ])
    );

    staffUtilisation = withCommitment
      .map(([id, hours]) => ({
        label: nameOf.get(id) ?? "Unknown",
        value: Math.round(((logged.get(id) ?? 0) / hours) * 100),
        hint: `${Math.round(logged.get(id) ?? 0)}h logged of ${hours}h committed`,
      }))
      .sort((a, b) => b.value - a.value);
  }

  /* ------------------------------------------------------- ratings --- */
  const ratingRows = (reviews.data ?? []) as { rating: number }[];
  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star} star`,
    value: ratingRows.filter((r) => r.rating === star).length,
  }));

  /* ---------------------------------------------------- collection --- */
  const invoiceRows = (invoices.data ?? []) as { id: string; status: string }[];
  const live = invoiceRows.filter((i) => i.status !== "void");

  let billed = 0;
  let collected = 0;
  if (live.length > 0) {
    const { data: totals } = await supabase
      .from("invoice_totals")
      .select("invoice_id, total, paid")
      .in("invoice_id", live.map((i) => i.id));

    for (const t of (totals ?? []) as { total: number; paid: number }[]) {
      billed += Number(t.total) || 0;
      collected += Number(t.paid) || 0;
    }
  }

  return {
    revenueByMonth,
    clientsByMonth,
    leadFunnel,
    projectStatus,
    accountHealth,
    staffUtilisation,
    ratingDistribution,
    collection: {
      billed: Math.round(billed),
      collected: Math.round(collected),
      outstanding: Math.round(billed - collected),
      // Null rather than 0 when nothing has been billed: "no invoices" and
      // "billed but nobody paid" are opposite states and must not look alike.
      rate: billed > 0 ? Math.round((collected / billed) * 100) : null,
    },
    totals: {
      leads: leadRows.length,
      clients: orgRows.length,
      projects: projectRows.length,
      reviews: ratingRows.length,
    },
  };
}
