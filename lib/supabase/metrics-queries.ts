import { createClient } from "./server";

/**
 * Command-bar metrics.
 *
 * Both figures come from `invoice_totals`, so they cannot disagree with the
 * invoices behind them. Every number here is derived; nothing is stored as a
 * headline figure, which is what let the previous hardcoded $142,500 sit on
 * every admin page contradicting the billing data beside it.
 */

export type CommandBarMetrics = {
  /** Payments received since the start of the current month. */
  monthlyRevenue: number;
  /** Percentage change against the same span last month; null when there is no
   *  prior month to compare against, so the UI can omit the badge rather than
   *  print a meaningless +100%. */
  revenueChangePct: number | null;
  /** Outstanding on invoices that have been sent and not yet settled. */
  pipeline: number;
  /** How many invoices make up that pipeline — the figure is meaningless to an
   *  admin without it. */
  pipelineCount: number;
};

export async function getCommandBarMetrics(): Promise<CommandBarMetrics> {
  const supabase = await createClient();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [{ data: thisMonth }, { data: lastMonth }, { data: open }] = await Promise.all([
    supabase.from("invoice_payments").select("amount").gte("paid_at", monthStart),
    supabase
      .from("invoice_payments")
      .select("amount")
      .gte("paid_at", prevStart)
      .lt("paid_at", monthStart),
    // Draft invoices are not pipeline: nothing has been asked for yet.
    supabase.from("invoices").select("id").in("status", ["sent", "overdue"]),
  ]);

  // Two queries rather than an embed. PostgREST cannot infer a relationship to
  // invoice_totals because it is a view, so `invoices.select("invoice_totals(...)")`
  // silently returned nothing and the pipeline read $0 with real invoices open.
  const openIds = (open ?? []).map((r) => r.id as string);
  const { data: totals } = openIds.length
    ? await supabase.from("invoice_totals").select("outstanding").in("invoice_id", openIds)
    : { data: [] as { outstanding: number | null }[] };

  const sum = (rows: { amount: number }[] | null) =>
    (rows ?? []).reduce((n, r) => n + Number(r.amount), 0);

  const revenue = sum(thisMonth as { amount: number }[] | null);
  const prior = sum(lastMonth as { amount: number }[] | null);

  const outstanding = (totals ?? []).reduce(
    (n, r) => n + Number(r.outstanding ?? 0),
    0
  );

  return {
    monthlyRevenue: revenue,
    revenueChangePct: prior > 0 ? Math.round(((revenue - prior) / prior) * 100) : null,
    pipeline: outstanding,
    pipelineCount: openIds.length,
  };
}
