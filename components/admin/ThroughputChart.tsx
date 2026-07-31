"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { ThroughputSample } from "@/lib/infrastructure";

const full = new Intl.NumberFormat("en-US");

function agoLabel(minutesAgo: number) {
  if (minutesAgo === 0) return "now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const h = Math.floor(minutesAgo / 60);
  const m = minutesAgo % 60;
  return m === 0 ? `${h}h ago` : `${h}h ${m}m ago`;
}

/**
 * Transactions per second across the window.
 *
 * Bars are sized from the data and never change size on hover — only their
 * colour lifts — because a bar that grows under the cursor reads as a change in
 * the value it represents. The peak bar is highlighted permanently, which is
 * the one comparison this chart is actually for.
 */
export function ThroughputChart({ samples }: { samples: ThroughputSample[] }) {
  const [active, setActive] = React.useState<number | null>(null);

  const max = Math.max(...samples.map((s) => s.tps));
  const peakIndex = samples.findIndex((s) => s.tps === max);
  const shown = active ?? samples.length - 1;
  const sample = samples[shown];

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <p aria-live="polite" className="flex flex-wrap items-baseline gap-x-2 text-[0.8125rem]">
        <span data-tabular className="font-heading text-2xl font-bold text-ink">
          {full.format(sample.tps)}
        </span>
        <span className="text-ink-tertiary">TPS</span>
        <span className="text-ink-tertiary">· {agoLabel(sample.minutesAgo)}</span>
        {shown === peakIndex && <span className="font-semibold text-brand">· peak</span>}
      </p>

      {/* A list, because that is what it is: one labelled value per bar. */}
      <ul
        className="flex min-h-0 flex-1 items-end gap-0.5"
        onPointerLeave={() => setActive(null)}
      >
        {samples.map((s, i) => {
          const height = (s.tps / max) * 100;
          const isPeak = i === peakIndex;
          const isActive = i === shown;
          return (
            <li key={s.minutesAgo} className="flex h-full flex-1 items-end">
              <button
                type="button"
                onPointerEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                aria-label={`${full.format(s.tps)} transactions per second, ${agoLabel(s.minutesAgo)}`}
                style={{ height: `${height}%` }}
                className={cn(
                  "w-full rounded-t-sm transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  isPeak
                    ? "bg-brand shadow-[0_0_16px_var(--brand-glow)]"
                    : isActive
                      ? "bg-brand/70"
                      : "bg-brand/25 hover:bg-brand/45"
                )}
              />
            </li>
          );
        })}
      </ul>

      <div className="flex justify-between text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
        <span>{agoLabel(samples[0].minutesAgo)}</span>
        <span>{agoLabel(samples[Math.floor(samples.length / 2)].minutesAgo)}</span>
        <span>now</span>
      </div>
    </div>
  );
}
