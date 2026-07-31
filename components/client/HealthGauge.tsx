"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Account health ring.
 *
 * The design showed the explanation in a CSS hover tooltip, which is invisible
 * to keyboard and touch users — and this is the one number a client is most
 * likely to want explained. It is a real popover: hover, click, and Enter all
 * open it, Escape closes.
 *
 * Drawn as SVG rather than the source's `conic-gradient` + `mask`, so the arc
 * can animate and the whole thing carries one accessible name.
 */
export function HealthGauge({
  score,
  basis,
  size = 128,
}: {
  score: number;
  basis: string;
  size?: number;
}) {
  const stroke = Math.round(size * 0.075);
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, score));

  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={120}
        render={
          <button
            type="button"
            aria-label={`Account health ${clamped} out of 100. ${basis}`}
            className={cn(
              "relative z-10 grid shrink-0 place-items-center rounded-full",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
            )}
            style={{ width: size, height: size }}
          >
            <svg width={size} height={size} className="-rotate-90" aria-hidden>
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--line)"
                strokeWidth={stroke}
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke="var(--brand)"
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={circumference - (clamped / 100) * circumference}
                className="transition-[stroke-dashoffset] duration-(--duration-deliberate) ease-(--ease-out-expo)"
              />
            </svg>

            <span className="absolute flex flex-col items-center" aria-hidden>
              <span
                data-tabular
                className="font-heading text-[2.25rem] leading-none font-bold text-brand"
              >
                {clamped}
              </span>
              <span className="text-[0.8125rem] tracking-widest text-ink-tertiary uppercase">
                Health
              </span>
            </span>
          </button>
        }
      />
      <PopoverContent side="bottom" className="w-64 text-center">
        <p className="text-[0.8125rem] leading-snug text-ink-secondary">{basis}</p>
      </PopoverContent>
    </Popover>
  );
}
