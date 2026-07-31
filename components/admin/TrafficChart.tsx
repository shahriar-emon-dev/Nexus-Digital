"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import type { SeoDay } from "@/lib/seo";

const W = 1000;
const H = 340;
const PAD = { top: 16, right: 8, bottom: 8, left: 8 };

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit" });
const full = new Intl.NumberFormat("en-US");

/**
 * Clicks against impressions over the reporting window.
 *
 * Two independent y-scales, because impressions run roughly thirty times
 * clicks — plotting both against one axis would flatten the clicks line onto
 * the floor. That is why each series is labelled with its own colour in the
 * legend and the readout, rather than sharing a single axis the reader would
 * naturally assume.
 *
 * The table underneath is the accessible form of the same data; the SVG itself
 * is `aria-hidden` so a screen reader gets the numbers, not the geometry.
 */
export function TrafficChart({ days }: { days: SeoDay[] }) {
  const [active, setActive] = React.useState<number | null>(null);
  const frame = React.useRef<number | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  React.useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    },
    []
  );

  const scale = React.useMemo(() => {
    const plotW = W - PAD.left - PAD.right;
    const plotH = H - PAD.top - PAD.bottom;
    const maxImpressions = Math.max(...days.map((d) => d.impressions));
    const maxClicks = Math.max(...days.map((d) => d.clicks));

    const x = (i: number) => PAD.left + (i / (days.length - 1)) * plotW;
    const y = (value: number, max: number) => PAD.top + plotH - (value / max) * plotH;

    const path = (pick: (d: SeoDay) => number, max: number) =>
      days
        .map((d, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)} ${y(pick(d), max).toFixed(1)}`)
        .join(" ");

    const areaOf = (line: string) => `${line} L${W - PAD.right} ${H} L${PAD.left} ${H} Z`;

    const impressionsLine = path((d) => d.impressions, maxImpressions);
    const clicksLine = path((d) => d.clicks, maxClicks);

    return {
      x,
      impressionsLine,
      clicksLine,
      impressionsArea: areaOf(impressionsLine),
      clicksArea: areaOf(clicksLine),
      yImpressions: (v: number) => y(v, maxImpressions),
      yClicks: (v: number) => y(v, maxClicks),
    };
  }, [days]);

  function pointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (frame.current !== null) return;
    const { clientX } = event;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const box = svgRef.current?.getBoundingClientRect();
      if (!box) return;
      const ratio = (clientX - box.left) / box.width;
      const index = Math.round(ratio * (days.length - 1));
      setActive(Math.min(days.length - 1, Math.max(0, index)));
    });
  }

  const shown = active === null ? days.length - 1 : active;
  const day = days[shown];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ul className="flex flex-wrap items-center gap-6">
          <Legend tone="ion" label="Impressions" value={full.format(day.impressions)} />
          <Legend tone="brand" label="Clicks" value={full.format(day.clicks)} />
        </ul>
        <p aria-live="polite" className="text-[0.8125rem] text-ink-tertiary">
          {active === null ? "Latest: " : ""}
          <time dateTime={day.date} className="font-medium text-ink-secondary">
            {dayLabel.format(new Date(day.date))}
          </time>
        </p>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          aria-hidden
          focusable="false"
          className="h-[280px] w-full touch-pan-y md:h-[340px]"
          onPointerMove={pointerMove}
          onPointerLeave={() => setActive(null)}
        >
          <defs>
            <linearGradient id="traffic-ion" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--ion)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--ion)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="traffic-brand" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--brand)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75].map((f) => (
            <line
              key={f}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={PAD.top + f * (H - PAD.top - PAD.bottom)}
              y2={PAD.top + f * (H - PAD.top - PAD.bottom)}
              stroke="var(--line)"
              strokeWidth="1"
            />
          ))}

          <path d={scale.impressionsArea} fill="url(#traffic-ion)" />
          <path d={scale.clicksArea} fill="url(#traffic-brand)" />
          <path
            d={scale.impressionsLine}
            fill="none"
            stroke="var(--ion)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={scale.clicksLine}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {active !== null && (
            <g>
              <line
                x1={scale.x(active)}
                x2={scale.x(active)}
                y1={PAD.top}
                y2={H - PAD.bottom}
                stroke="var(--line-strong)"
                strokeWidth="1"
              />
              {/* Radius is fixed — a marker that grows on hover reads as a
                  change in the value it marks. */}
              <circle
                cx={scale.x(active)}
                cy={scale.yImpressions(days[active].impressions)}
                r="5"
                fill="var(--ion)"
                stroke="var(--canvas)"
                strokeWidth="2"
              />
              <circle
                cx={scale.x(active)}
                cy={scale.yClicks(days[active].clicks)}
                r="5"
                fill="var(--brand)"
                stroke="var(--canvas)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        <div className="mt-3 flex justify-between text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const d = days[Math.round(f * (days.length - 1))];
            return <span key={d.date}>{dayLabel.format(new Date(d.date))}</span>;
          })}
        </div>
      </div>

      {/* The same series in a form assistive tech and print can both use. */}
      <details className="group">
        <summary className="cursor-pointer list-none rounded-lg text-[0.8125rem] text-ink-tertiary transition-colors hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none">
          View the underlying figures
        </summary>
        <div className="scrollbar-none mt-4 max-h-64 overflow-auto rounded-xl border border-line">
          <table className="w-full text-left text-[0.8125rem]">
            <caption className="sr-only">
              Daily clicks and impressions for the reporting window
            </caption>
            <thead className="sticky top-0 bg-surface-sunken">
              <tr>
                <th scope="col" className="px-4 py-2 font-semibold text-ink-tertiary">
                  Date
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold text-ink-tertiary">
                  Impressions
                </th>
                <th scope="col" className="px-4 py-2 text-right font-semibold text-ink-tertiary">
                  Clicks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line-subtle">
              {days.map((d) => (
                <tr key={d.date}>
                  <th scope="row" className="px-4 py-1.5 text-left font-normal text-ink-secondary">
                    <time dateTime={d.date}>{dayLabel.format(new Date(d.date))}</time>
                  </th>
                  <td data-tabular className="px-4 py-1.5 text-right text-ink">
                    {full.format(d.impressions)}
                  </td>
                  <td data-tabular className="px-4 py-1.5 text-right text-ink">
                    {full.format(d.clicks)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function Legend({
  tone,
  label,
  value,
}: {
  tone: "brand" | "ion";
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={cn("size-3 shrink-0 rounded-full", tone === "ion" ? "bg-ion" : "bg-brand")}
      />
      <span className="text-[0.8125rem] text-ink-tertiary">{label}</span>
      <span data-tabular className="text-[0.8125rem] font-semibold text-ink">
        {value}
      </span>
    </li>
  );
}
