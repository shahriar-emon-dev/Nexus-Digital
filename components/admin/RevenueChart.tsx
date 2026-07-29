"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type Point = { label: string; value: number; current?: boolean };

const datasets: Record<"Monthly" | "Daily", { unit: string; points: Point[] }> = {
  Monthly: {
    unit: "k",
    points: [
      { label: "Jan", value: 84 },
      { label: "Feb", value: 92 },
      { label: "Mar", value: 88 },
      { label: "Apr", value: 118 },
      { label: "May", value: 142, current: true },
      { label: "Jun", value: 104 },
    ],
  },
  Daily: {
    unit: "k",
    points: [
      { label: "Mon", value: 4.2 },
      { label: "Tue", value: 5.8 },
      { label: "Wed", value: 5.1 },
      { label: "Thu", value: 6.4 },
      { label: "Fri", value: 7.1, current: true },
      { label: "Sat", value: 2.3 },
    ],
  },
};

type Range = keyof typeof datasets;

/**
 * Revenue by period — one series, so every bar wears the same colour and only
 * the current period is picked out. Hover shows a read-out; it never resizes
 * the bar, because changing a bar's height misstates the value it encodes.
 *
 * The range toggle actually switches data. In the source it was two styled
 * buttons wired to nothing.
 */
export function RevenueChart() {
  const [range, setRange] = React.useState<Range>("Monthly");
  const data = datasets[range];
  const max = Math.max(...data.points.map((p) => p.value));

  return (
    <figure>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <figcaption>
          <h3 className="font-heading text-xl font-semibold text-ink">Revenue Growth</h3>
          <p className="text-xs text-ink-tertiary">
            Aggregated data from all active contracts
          </p>
        </figcaption>

        <div
          role="radiogroup"
          aria-label="Time range"
          className="flex gap-2"
        >
          {(Object.keys(datasets) as Range[]).map((key) => {
            const selected = range === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setRange(key)}
                className={cn(
                  "rounded px-3 py-1 text-[0.6875rem] transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "bg-brand font-bold text-brand-fg"
                    : "border border-line bg-surface-sunken text-ink-tertiary hover:text-ink"
                )}
              >
                {key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative flex h-64 w-full items-end gap-[2px]">
        {data.points.map((point) => (
          <div key={point.label} className="group/bar relative flex h-full flex-1 items-end">
            <div
              className={cn(
                "w-full rounded-t-[4px] transition-opacity duration-(--duration-fast) group-hover/bar:opacity-80",
                point.current ? "bg-brand" : "bg-chart-1"
              )}
              style={{ height: `${(point.value / max) * 100}%` }}
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
              ${point.value}
              {data.unit}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex gap-[2px] px-2">
        {data.points.map((point) => (
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
