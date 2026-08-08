import { Activity, Building2, Layers, Star } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MarketingStat } from "@/lib/supabase/marketing-stats";
import { CountUp } from "@/components/marketing/CountUp";

/**
 * The About page's headline figures.
 *
 * These were three literals presented as live telemetry — "24 Active Global
 * Builds" with a pulsing indicator, "1420 Commits This Month", "4.9 Average
 * CSAT". Nothing in this system records commits or satisfaction scores, and the
 * pulsing dot implied a feed that did not exist.
 *
 * They now come from the same derivation the homepage uses, so the two pages
 * cannot quote different numbers. A stat with nothing behind it is omitted
 * rather than shown as zero, and if none survive the whole band is skipped —
 * which is why this returns null rather than rendering an empty shell.
 */

const icons = {
  brand: Layers,
  ion: Building2,
  orchid: Activity,
  ink: Star,
} as const;

const tones = {
  brand: "text-brand",
  ion: "text-ion",
  orchid: "text-chart-3",
  ink: "text-ink",
} as const;

export function AgencyPulse({ stats }: { stats: MarketingStat[] }) {
  if (stats.length === 0) return null;

  return (
    <section className="relative z-20 mx-auto -mt-20 max-w-7xl px-4 md:px-10">
      <div className="glass rounded-2xl p-1">
        <dl
          className={cn(
            "grid grid-cols-1 gap-8 divide-y divide-line rounded-xl bg-canvas p-8 md:divide-x md:divide-y-0",
            stats.length === 2 && "md:grid-cols-2",
            stats.length >= 3 && "md:grid-cols-3"
          )}
        >
          {stats.slice(0, 3).map((stat) => {
            const Icon = icons[stat.tone];
            return (
              <div key={stat.label} className="flex flex-col gap-2 pt-8 first:pt-0 md:pt-0">
                <dt className="flex items-center gap-2 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                  <Icon className={cn("size-4", tones[stat.tone])} aria-hidden />
                  Measured
                </dt>
                <dd className="flex flex-col gap-1">
                  <CountUp
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    decimalPlaces={stat.decimalPlaces ?? 0}
                    tone={stat.tone}
                    size="display"
                  />
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}
