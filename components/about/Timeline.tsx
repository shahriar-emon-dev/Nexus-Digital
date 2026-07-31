"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { milestones } from "@/lib/agency";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/Reveal";

const tone = {
  brand: { text: "text-brand", ring: "border-brand", dot: "bg-brand" },
  ion: { text: "text-ion", ring: "border-ion", dot: "bg-ion" },
  orchid: { text: "text-chart-3", ring: "border-chart-3", dot: "bg-chart-3" },
} as const;

/**
 * Alternating milestone timeline.
 *
 * Added motion: the centre track draws downward as the section scrolls through
 * the viewport, and each milestone slides in from its own side. Both are
 * disabled under `prefers-reduced-motion` — the track simply renders full
 * height and the cards render in place.
 */
export function Timeline() {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const fillRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      if (fillRef.current) fillRef.current.style.transform = "scaleY(1)";
      return;
    }

    let frame = 0;
    const update = () => {
      frame = 0;
      const node = trackRef.current;
      const fill = fillRef.current;
      if (!node || !fill) return;
      const rect = node.getBoundingClientRect();
      // 0 when the track's top reaches the viewport middle, 1 when its bottom does.
      const mid = window.innerHeight * 0.5;
      const progress = (mid - rect.top) / rect.height;
      fill.style.transform = `scaleY(${Math.max(0, Math.min(1, progress))})`;
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={trackRef} className="relative">
      {/* Track */}
      <div
        className="absolute top-0 left-1/2 hidden h-full w-0.5 -translate-x-1/2 bg-line md:block"
        aria-hidden
      >
        <span
          ref={fillRef}
          className="block h-full w-full origin-top scale-y-0 bg-gradient-to-b from-brand/0 via-brand to-chart-3"
        />
      </div>

      <ol className="flex flex-col gap-24">
        {milestones.map((milestone, i) => {
          const left = i % 2 === 0;
          const t = tone[milestone.tone];
          return (
            <li key={milestone.year} className="group flex w-full flex-col items-center md:flex-row">
              {/* Left cell */}
              <div
                className={cn(
                  "order-2 w-full md:order-1 md:w-1/2 md:pr-16 md:text-right",
                  left ? "mt-8 md:mt-0" : "hidden md:block"
                )}
              >
                {left && (
                  <Reveal className="inline-block max-w-md text-left">
                    <MilestoneCard milestone={milestone} />
                  </Reveal>
                )}
              </div>

              {/* Node */}
              <div className="relative z-10 order-1 md:order-2">
                <span
                  className={cn(
                    "grid size-12 place-items-center rounded-full border-4 bg-surface",
                    "drop-shadow-[0_0_8px_var(--brand-glow)] transition-transform duration-(--duration-normal) group-hover:scale-110",
                    t.ring
                  )}
                >
                  <span className="relative flex size-3" aria-hidden>
                    {milestone.current && (
                      <span
                        className={cn(
                          "absolute inset-0 animate-ping rounded-full opacity-70 motion-reduce:animate-none",
                          t.dot
                        )}
                      />
                    )}
                    <span className={cn("relative size-3 rounded-full", t.dot)} />
                  </span>
                </span>
              </div>

              {/* Right cell */}
              <div
                className={cn(
                  "w-full md:w-1/2 md:pl-16",
                  left ? "order-3 hidden md:block" : "order-2 mt-8 md:order-3 md:mt-0"
                )}
              >
                {!left && (
                  <Reveal className="inline-block max-w-md">
                    <MilestoneCard milestone={milestone} />
                  </Reveal>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function MilestoneCard({ milestone }: { milestone: (typeof milestones)[number] }) {
  const t = tone[milestone.tone];
  return (
    <Card
      variant="glass"
      className={cn(
        "rounded-2xl p-8 transition-transform duration-(--duration-normal) group-hover:-translate-y-2",
        milestone.current && "border-beam"
      )}
    >
      <p className={cn("mb-2 font-heading text-[2rem] leading-none font-bold", t.text)}>
        {milestone.year}
      </p>
      <h3 className="mb-4 font-heading text-xl font-semibold text-ink">{milestone.title}</h3>
      <p className="leading-relaxed text-ink-tertiary">{milestone.body}</p>
    </Card>
  );
}
