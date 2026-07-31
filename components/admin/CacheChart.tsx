"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { ThroughputSample } from "@/lib/infrastructure";

const W = 100;
const H = 100;
const full = new Intl.NumberFormat("en-US");

/**
 * Cache hits against misses.
 *
 * Both series share one axis here, unlike the SEO traffic chart — they are
 * counts of the same thing, so the difference in height is the point. Misses
 * are drawn on top so the small series is never buried under the large one.
 */
export function CacheChart({ samples }: { samples: ThroughputSample[] }) {
  const [active, setActive] = React.useState<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);
  const frame = React.useRef<number | null>(null);

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const max = Math.max(...samples.map((s) => s.cacheHits + s.cacheMisses));

  const path = (pick: (s: ThroughputSample) => number) =>
    samples
      .map((s, i) => {
        const x = (i / (samples.length - 1)) * W;
        const y = H - (pick(s) / max) * H;
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");

  const hitsLine = path((s) => s.cacheHits);
  const missLine = path((s) => s.cacheMisses);
  const area = (line: string) => `${line} L${W} ${H} L0 ${H} Z`;

  function pointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (frame.current !== null) return;
    const { clientX } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const box = svgRef.current?.getBoundingClientRect();
      if (!box) return;
      const index = Math.round(((clientX - box.left) / box.width) * (samples.length - 1));
      setActive(Math.min(samples.length - 1, Math.max(0, index)));
    });
  }

  const shown = active ?? samples.length - 1;
  const sample = samples[shown];
  const rate = (sample.cacheHits / (sample.cacheHits + sample.cacheMisses)) * 100;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ul className="flex flex-wrap items-center gap-5">
          <Legend tone="ion" label="Hits" value={full.format(sample.cacheHits)} />
          <Legend tone="danger" label="Misses" value={full.format(sample.cacheMisses)} />
        </ul>
        <p aria-live="polite" data-tabular className="text-[0.8125rem] text-ink-tertiary">
          <span className="font-semibold text-ink">{rate.toFixed(1)}%</span> hit rate
        </p>
      </div>

      <div className="relative min-h-0 flex-1">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden
          focusable="false"
          className="size-full touch-pan-y"
          onPointerMove={pointerMove}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id="cache-hits" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--ion)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--ion)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="cache-miss" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--danger)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--danger)" stopOpacity="0" />
            </linearGradient>
          </defs>

          <path d={area(hitsLine)} fill="url(#cache-hits)" />
          <path
            d={hitsLine}
            fill="none"
            stroke="var(--ion)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path d={area(missLine)} fill="url(#cache-miss)" />
          <path
            d={missLine}
            fill="none"
            stroke="var(--danger)"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />

          {active !== null && (
            <line
              x1={(active / (samples.length - 1)) * W}
              x2={(active / (samples.length - 1)) * W}
              y1={0}
              y2={H}
              stroke="var(--line-strong)"
              strokeWidth="1"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
      </div>
    </div>
  );
}

function Legend({
  tone,
  label,
  value,
}: {
  tone: "ion" | "danger";
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn("size-3 shrink-0 rounded-sm", tone === "ion" ? "bg-ion" : "bg-danger")}
      />
      <span className="text-[0.8125rem] text-ink-tertiary">{label}</span>
      <span data-tabular className="text-[0.8125rem] font-semibold text-ink">
        {value}
      </span>
    </li>
  );
}
