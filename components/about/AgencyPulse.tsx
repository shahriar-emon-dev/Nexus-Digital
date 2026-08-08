"use client";

import { Activity, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { agencyPulse } from "@/lib/agency";
import { CountUp } from "@/components/marketing/CountUp";

const icons = { commits: Activity, csat: Star } as const;

/**
 * Live telemetry strip, overlapping the hero.
 *
 * The figures count up on entry — the source shipped an IntersectionObserver
 * that added `opacity-100` to elements it had never made transparent, so it
 * animated nothing. `CountUp` keeps the final value in the accessible name, so
 * a screen reader gets the number rather than a spinning counter.
 */
export function AgencyPulse() {
  return (
    <section className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 md:px-10">
      <div className="glass rounded-2xl p-1">
        <dl className="grid grid-cols-1 gap-8 divide-y divide-line rounded-xl bg-canvas p-8 md:grid-cols-3 md:divide-x md:divide-y-0">
          {agencyPulse.map((stat, i) => {
            const Icon = icons[stat.id as keyof typeof icons];
            return (
              <div
                key={stat.id}
                className={cn(
                  "flex flex-col items-center pt-8 md:items-start md:pt-0",
                  i === 0 && "pt-0",
                  i > 0 && "md:pl-12"
                )}
              >
                <p className="mb-2 flex items-center gap-2">
                  {stat.live ? (
                    <span className="relative flex size-2" aria-hidden>
                      <span className="absolute inset-0 animate-ping rounded-full bg-danger opacity-70 motion-reduce:animate-none" />
                      <span className="relative size-2 rounded-full bg-danger" />
                    </span>
                  ) : (
                    Icon && <Icon className="size-5 text-ion" aria-hidden />
                  )}
                  <span
                    className={cn(
                      "text-[0.8125rem] font-semibold tracking-wide uppercase",
                      stat.live ? "text-danger" : "text-ink-tertiary"
                    )}
                  >
                    {stat.eyebrow}
                  </span>
                </p>

                <CountUp
                  value={stat.value}
                  suffix={stat.suffix}
                  decimalPlaces={stat.decimalPlaces ?? 0}
                  label={stat.label}
                  tone={stat.tone}
                  size="stat"
                />
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
