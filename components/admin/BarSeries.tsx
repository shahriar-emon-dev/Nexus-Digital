import { cn } from "@/lib/utils";
import type { Bar } from "@/lib/supabase/analytics-queries";

/**
 * A horizontal bar series.
 *
 * Horizontal rather than vertical because every series on the analytics page
 * has a text category — staff names, lead stages, project statuses — and
 * rotated x-axis labels are a readability tax paid on every glance.
 *
 * Every bar is direct-labelled with its value. That is normally an
 * anti-pattern — a number on every point is chaos — but it holds only for dense
 * series; these are four to six rows, and labelling them means every value is
 * readable without a tooltip and without a separate table view.
 *
 * One series is one colour. Colouring bars darker-where-bigger would burn the
 * only free channel re-encoding the length the bar already shows.
 */
export function BarSeries({
  data,
  tone = "chart-1",
  format,
  suffix,
  emptyLabel = "Nothing recorded yet",
}: {
  data: Bar[];
  /** A token from the design system's validated ramp, in fixed order. */
  tone?: "chart-1" | "chart-2" | "chart-3" | "chart-4" | "brand" | "ion";
  format?: (n: number) => string;
  suffix?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0 || max === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-tertiary">
        {emptyLabel}
      </p>
    );
  }

  const fill: Record<string, string> = {
    "chart-1": "bg-chart-1",
    "chart-2": "bg-chart-2",
    "chart-3": "bg-chart-3",
    "chart-4": "bg-chart-4",
    brand: "bg-brand",
    ion: "bg-ion",
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
          <span className="truncate text-[0.8125rem] text-ink-secondary" title={d.label}>
            {d.label}
          </span>

          {/* The track is one shade off the surface, not a heavy block. */}
          <span className="h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
            <span
              className={cn("block h-full rounded-full", fill[tone])}
              // Zero keeps a hairline so the row reads as "measured, none"
              // rather than as a missing bar.
              style={{ width: `${Math.max((d.value / max) * 100, d.value > 0 ? 2 : 0)}%` }}
            />
          </span>

          <span
            data-tabular
            className="min-w-14 text-right text-[0.8125rem] font-medium text-ink"
            title={d.hint}
          >
            {format ? format(d.value) : d.value}
            {suffix}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * A monthly column series.
 *
 * Vertical here because the categories are months — short, ordered, and read
 * left-to-right as time. Only the final column is direct-labelled; the rest
 * carry their value in the title attribute and the accessible list below.
 */
export function ColumnSeries({
  data,
  format,
  emptyLabel = "Nothing recorded yet",
}: {
  data: Bar[];
  format?: (n: number) => string;
  emptyLabel?: string;
}) {
  const max = Math.max(...data.map((d) => d.value), 0);

  if (data.length === 0 || max === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-tertiary">
        {emptyLabel}
      </p>
    );
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="flex h-40 items-end gap-1.5">
        {data.map((d, i) => {
          const last = i === data.length - 1;
          return (
            <div key={d.label} className="group/col relative flex h-full flex-1 items-end">
              <div
                className={cn(
                  "w-full rounded-t-[4px] transition-opacity group-hover/col:opacity-80",
                  last ? "bg-brand" : "bg-chart-1"
                )}
                style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 1.5 : 0)}%` }}
                title={`${d.label}: ${format ? format(d.value) : d.value}`}
              />
              {last && d.value > 0 && (
                <span
                  data-tabular
                  className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 rounded bg-brand px-1.5 py-0.5 text-[0.625rem] font-semibold whitespace-nowrap text-brand-fg"
                >
                  {format ? format(d.value) : d.value}
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-1.5">
        {data.map((d, i) => (
          <span
            key={d.label}
            className={cn(
              "flex-1 text-center text-[0.625rem] tracking-wide uppercase",
              i === data.length - 1 ? "font-semibold text-brand" : "text-ink-tertiary"
            )}
          >
            {d.label}
          </span>
        ))}
      </div>
    </figure>
  );
}

/**
 * Status counts.
 *
 * Uses the reserved status palette rather than categorical hues, because these
 * values mean good/warning/bad. Each carries its label as text, so the meaning
 * never rests on colour alone.
 */
export function StatusBars({ data }: { data: Bar[] }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-sm text-ink-tertiary">
        No client accounts yet
      </p>
    );
  }

  const tone: Record<string, string> = {
    healthy: "bg-success",
    onboarding: "bg-info",
    "at-risk": "bg-warning",
    churned: "bg-danger",
  };

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((d) => (
        <li key={d.label} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3">
          <span className="text-[0.8125rem] text-ink-secondary capitalize">{d.label}</span>
          <span className="h-2 w-full overflow-hidden rounded-full bg-line" aria-hidden>
            <span
              className={cn("block h-full rounded-full", tone[d.label] ?? "bg-chart-1")}
              style={{ width: `${Math.max((d.value / total) * 100, d.value > 0 ? 2 : 0)}%` }}
            />
          </span>
          <span data-tabular className="min-w-14 text-right text-[0.8125rem] font-medium text-ink">
            {d.value}
          </span>
        </li>
      ))}
    </ul>
  );
}
