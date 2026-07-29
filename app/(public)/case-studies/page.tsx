import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CaseStudyGrid } from "./CaseStudyGrid";

export const metadata: Metadata = {
  title: "Case Studies",
  description:
    "Engineered success. Explore how Nexus builds high-availability architecture, headless commerce and decentralised platforms for clients across FinTech, retail, enterprise and Web3.",
};

export default function CaseStudiesPage() {
  return (
    <>
      <div className="noise-field" aria-hidden />
      <span
        className="bloom -top-[10%] -right-[10%] size-[60vw] bg-brand/10 blur-[120px]"
        aria-hidden
      />
      <span
        className="bloom -bottom-[10%] -left-[10%] size-[50vw] bg-ion/10 blur-[120px]"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-4 pt-12 pb-20 md:px-10">
        <header className="mb-16">
          <p className="mb-4 block text-[0.8125rem] font-semibold tracking-[0.3em] text-brand uppercase">
            Archive 2026
          </p>
          <h1 className="max-w-3xl font-heading text-display leading-tight font-bold tracking-tight text-balance text-ink">
            Engineered Success:
            <br />
            <span className="text-ink-secondary opacity-80">Case Studies</span>
          </h1>
        </header>

        <CaseStudyGrid />

        <Card
          variant="glass"
          className="mt-12 items-center rounded-2xl p-12 text-center"
        >
          <h2 className="mb-6 font-heading text-[3rem] leading-[1.2] font-bold text-balance text-ink">
            Ready to Engineer Your Own Success?
          </h2>
          <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-ink-secondary">
            Our team of elite engineers and designers are ready to tackle your most complex
            digital challenges.
          </p>
          <Button
            size="xl"
            className="rounded-lg px-10 tracking-widest uppercase"
            render={<Link href="/contact" />}
          >
            Start a Project
          </Button>
        </Card>
      </div>
    </>
  );
}
