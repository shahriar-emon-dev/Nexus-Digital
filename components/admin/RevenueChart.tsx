import { TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { getRevenueSeries } from "@/lib/supabase/dashboard-queries";
import { EmptyState } from "@/components/shared/EmptyState";

/**
 * Revenue actually collected, by month.
 *
 * This component used to hold its own data: two hardcoded arrays, `Monthly`
 * running Jan 84k → Jun 104k and `Daily` running Mon 4.2k → Sat 2.3k, with a
 * range toggle that switched between two fictions. It rendered on `/admin` —
 * the first screen an administrator sees — above a Delivery Health panel and
 * summary cards that were all correctly wired to real queries. Roughly $628k of
 * invented revenue sat on a system whose `invoice_payments` table has never
 * held a single row, and it was the most credible-looking thing on the page
 * precisely because everything around it was honest.
 *
 * Now a server component reading `getRevenueSeries()`. The range toggle is gone
 * rather than reimplemented: a daily breakdown of payments is not a figure this
 * business needs on its landing page, and keeping a control alive purely
 * because it existed before is how the fake dataset justified itself in the
 * first place.
 *
 * With no payments recorded the chart yields to an empty state. Six flat zero
 * bars would read as a catastrophic quarter rather than as an unused feature.
 */
export async function RevenueChart() {
  const { points, hasData, basis } = await getRevenueSeries(6);

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  });

  const full = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  if (!hasData) {
    return (
      <figure>
        <figcaption className="mb-6">
          <h3 className="font-heading text-xl font-semibold text-ink">Revenue collected</h3>
          <p className="text-xs text-ink-tertiary">{basis}</p>
        </figcaption>
        <EmptyState
          icon={TrendingUp}
          title="No payments recorded yet"
          description="This chart plots cash received against invoices, month by month. It will fill in as payments are recorded on the Invoices screen."
        />
      </figure>
    );
  }

  // Scaling against the largest bar keeps small months visible. A zero month
  // still renders a hairline so the bar is present rather than missing.
  const max = Math.max(...points.map((p) => p.value), 1);
  const total = points.reduce((sum, p) => sum + p.value, 0);

  return (
    <figure>
      <div className="mb-8 flex flex-wrap items-baseline justify-between gap-3">
        <figcaption>
          <h3 className="font-heading text-xl font-semibold text-ink">Revenue collected</h3>
          <p className="text-xs text-ink-tertiary">{basis}</p>
        </figcaption>
        <p className="text-xs text-ink-tertiary">
          <span data-tabular className="font-semibold text-ink">
            {full.format(total)}
          </span>{" "}
          over 6 months
        </p>
      </div>

      <div className="relative flex h-64 w-full items-end gap-[2px]">
        {points.map((point) => (
          <div key={point.label} className="group/bar relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-opacity duration-(--duration-fast) group-hover/bar:opacity-80",
                point.current ? "bg-brand" : "bg-chart-1"
              )}
              style={{ height: `${Math.max((point.value / max) * 100, 0.5)}%` }}
            />

            {/* The current period is direct-labelled; the rest reveal on hover. */}
            <span
              data-tabular
              className={cn(
                "pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 rounded px-2 py-1",
                "text-[0.625rem] whitespace-nowrap transition-opacity duration-(--duration-fast)",
                point.current
                  ? "bg-brand font-bold text-brand-fg opacity-100"
                  : "border border-line bg-surface-raised text-ink opacity-0 shadow-e2 group-hover/bar:opacity-100"
              )}
            >
              {money.format(point.value)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-[2px] px-2">
        {points.map((point) => (
          <span
            key={point.label}
            className={cn(
              "flex-1 text-center text-[0.625rem] font-medium tracking-widest uppercase",
              point.current ? "text-brand" : "text-ink-tertiary"
            )}
          >
            {point.label}
          </span>
        ))}
      </div>
    </figure>
  );
}
