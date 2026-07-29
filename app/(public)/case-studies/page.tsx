import type { Metadata } from "next";
import { Aperture } from "lucide-react";

import { CursorGlow } from "@/components/marketing/CursorGlow";
import { WorkGrid } from "./WorkGrid";

export const metadata: Metadata = {
  title: "Our Work",
  description:
    "Our portfolio represents the nexus of high-performance engineering and visceral design. Explore our latest collaborations.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <div className="noise-field" aria-hidden />
      <CursorGlow />
      {/* The design's obsidian body wash, scoped to this route rather than
          pushed into the global stylesheet. */}
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,var(--surface),transparent_60%)]"
        aria-hidden
      />

      <section className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 md:px-10">
        <div className="flex flex-col items-end justify-between gap-12 md:flex-row">
          <div className="max-w-3xl">
            <h1 className="mb-6 font-heading text-display leading-tight font-bold text-balance text-ink">
              Pioneering <span className="text-brand">Digital Frontiers</span> Through
              Technical Excellence.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-secondary">
              Our portfolio represents the nexus of high-performance engineering and visceral
              design. Explore our latest collaborations.
            </p>
          </div>
          <Aperture
            className="size-10 shrink-0 text-brand drop-shadow-[0_0_10px_var(--brand)]"
            aria-hidden
          />
        </div>
      </section>

      <WorkGrid />
    </>
  );
}
