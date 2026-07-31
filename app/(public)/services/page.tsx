import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Brush,
  CheckCircle2,
  Code2,
  Network,
  Terminal,
  TrendingUp,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CursorTrail } from "@/components/marketing/CursorTrail";
import { Reveal } from "@/components/marketing/Reveal";

export const metadata: Metadata = {
  title: "Services",
  description:
    "We combine technical mastery with creative intuition to build software, brands, and digital strategies that redefine industries.",
};

const brandIdentityFacets = [
  { title: "Visual Strategy", body: "Cohesive brand systems" },
  { title: "Motion Design", body: "Fluid digital expression" },
  { title: "UI/UX Craft", body: "Interface excellence" },
];

const webCapabilities = [
  { title: "Frontend Engineering", body: "React, Next.js, and immersive WebGL" },
  { title: "Cloud Architecture", body: "Scalable AWS/Vercel deployments" },
  { title: "Headless CMS", body: "Contentful and Sanity integration" },
];

const growthDisciplines = [
  "SEO & Semantic Search",
  "Conversion Optimization",
  "Data Analytics Engineering",
];

const impactMetrics = [
  { label: "Retention Rate", value: "+42%", fill: 85, bar: "bg-chart-1", text: "text-chart-1" },
  { label: "User Engagement", value: "+68%", fill: 72, bar: "bg-chart-2", text: "text-chart-2" },
  { label: "Load Speed", value: "−1.2s", fill: 94, bar: "bg-chart-3", text: "text-chart-3" },
];

export default function ServicesPage() {
  return (
    <>
      <div className="noise-field" aria-hidden />
      <CursorTrail />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pt-12 pb-24 md:px-10 md:pt-24 md:pb-40">
        <span className="bloom -top-24 -left-24 size-96 bg-brand/12" aria-hidden />
        <span className="bloom top-1/2 -right-24 size-[500px] bg-ion/8" aria-hidden />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <p className="mb-6 text-overline font-semibold tracking-[0.2em] text-brand uppercase">
            Our Expertise
          </p>
          <h1 className="mb-8 font-heading text-display leading-tight font-bold text-balance text-ink">
            Engineering <span className="text-gradient-brand italic">Digital Excellence</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-ink-secondary">
            We combine technical mastery with creative intuition to build software, brands, and
            digital strategies that redefine industries.
          </p>
        </div>
      </section>

      {/* ── Services bento ───────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Brand Identity, with the two cards beneath it */}
          <div className="flex flex-col gap-6 lg:col-span-8">
            <Reveal>
              <PillarCard
                icon={Brush}
                accent="brand"
                title="Brand Identity"
                body="We craft visual languages that tell stories. From strategic positioning to typographic precision, we build brands that command attention."
                watermark={Network}
              >
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                  {brandIdentityFacets.map((facet) => (
                    <div
                      key={facet.title}
                      className="rounded-lg border border-line-subtle bg-surface-sunken/60 p-4 transition-colors duration-(--duration-fast) hover:border-brand-line"
                    >
                      <span className="mb-1 block text-[0.8125rem] font-semibold tracking-[0.05em] text-brand">
                        {facet.title}
                      </span>
                      <p className="text-xs text-ink-tertiary">{facet.body}</p>
                    </div>
                  ))}
                </div>
              </PillarCard>
            </Reveal>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Reveal delay={80} className="h-full">
                <Card variant="glass" interactive className="group h-full overflow-hidden">
                  <Link href="/case-studies" className="flex h-full flex-col focus:outline-none">
                    <div className="relative h-64">
                      {/* TODO: swap for a hosted asset — this URL is from the design
                          tool's CDN and will expire. */}
                      <Image
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrk72Spkwvjo-tdUYaDq0xau-97n1ZcfpvwlB5SeaP3OOZdN-YR9SXoIP6eeuVMAiZKwx4zoTT3soPti4bB8eSfySDRB3vT6XGwsnZFKpuEQ5LUSSNqEks9PRChSgyOlJt344YX2QVlEIWiTMqZDWgkfWHczuEwPa-vZYSmqdriWMwC24O4-61iSUDajlXRYq2NwvdEDLFjPtcBPoD3_Mlx-3itVw7bdEzvMn8lIWEtfvWTkxv0H-tdNlMvmjfXu3f8qlZqJpPoQe-"
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 320px, 100vw"
                        className="object-cover"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"
                        aria-hidden
                      />
                      <Badge
                        variant="ion"
                        size="sm"
                        className="absolute bottom-4 left-6 uppercase"
                      >
                        Case Study
                      </Badge>
                    </div>
                    <div className="p-6">
                      <h3 className="mb-2 font-heading text-xl font-semibold text-ink">
                        Aether Financial
                      </h3>
                      <p className="mb-4 text-sm leading-relaxed text-ink-tertiary">
                        Complete rebrand and mobile ecosystem for an AI-driven fintech platform.
                      </p>
                      <span className="inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.05em] text-brand transition-[gap] duration-(--duration-normal) group-hover:gap-4">
                        View Project
                        <ArrowRight className="size-3.5" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </Card>
              </Reveal>

              <Reveal delay={160} className="h-full">
                <Card
                  variant="glass"
                  interactive
                  className="h-full items-center justify-center p-8 text-center"
                >
                  <div className="relative mb-6 grid size-20 place-items-center rounded-full border-2 border-brand/20">
                    <span
                      className="absolute inset-0 animate-spin rounded-full border-t-2 border-brand motion-reduce:animate-none"
                      aria-hidden
                    />
                    <Terminal className="size-7 text-brand" aria-hidden />
                  </div>
                  <h3 className="mb-2 font-heading text-xl font-semibold text-ink">
                    Custom Development
                  </h3>
                  <p className="mb-6 text-sm leading-relaxed text-ink-tertiary">
                    Need something bespoke? We engineer tailor-made solutions for complex
                    problems.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full border-brand/40 text-brand"
                    render={<Link href="/contact" />}
                  >
                    Inquire Now
                  </Button>
                </Card>
              </Reveal>
            </div>
          </div>

          {/* Web Systems */}
          <Reveal delay={80} className="lg:col-span-4">
            <PillarCard
              icon={Code2}
              accent="ion"
              title="Web Systems"
              body="High-performance web architecture built with the latest stack. We prioritize speed, security, and scalability."
              className="h-full"
            >
              <ul className="flex flex-1 flex-col gap-6">
                {webCapabilities.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                    <div>
                      <span className="block text-[0.8125rem] font-semibold tracking-[0.05em] text-ink">
                        {item.title}
                      </span>
                      <p className="text-sm text-ink-tertiary">{item.body}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="mt-8 border-t border-line-subtle pt-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink-tertiary">Average Speed Score</span>
                  <span data-tabular className="font-semibold text-ion">
                    99/100
                  </span>
                </div>
                <div
                  className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-sunken"
                  aria-hidden
                >
                  <div className="h-full rounded-full bg-ion" style={{ width: "99%" }} />
                </div>
              </div>
            </PillarCard>
          </Reveal>
        </div>

        {/* Digital Growth row */}
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Card variant="glass" className="h-full overflow-hidden">
              <div className="relative h-full min-h-75">
                {/* TODO: swap for a hosted asset — design-tool CDN URL. */}
                <Image
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAvRLjTWXADroqeyJbg0Bety0SIemZrWnPcKqKmc3c2a7kbZpDaRR8atXbXOpyWTSD73F3uT7_9hWKFA9Il4hVVyXUX0bAZtgzQcObaYvnUjefbo8D5vHMmpys676fBlXCrQMQUeYUvV8XsP5PZlrxwHtk2ZfFTvuuJh0HxfPCDkzM5xq9rAGJbztwXG-jdDWhcZbA1gcMODAk-lmryd3ZaCs-qICMGRkQMkTrO4s9g4fEAUXd7R5meqfEdiHJtJQNvsxkZzktz3fob"
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 400px, 100vw"
                  className="object-cover opacity-60"
                />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-surface to-transparent"
                  aria-hidden
                />
                <div className="relative z-10 flex h-full flex-col justify-end p-10">
                  <h3 className="mb-2 font-heading text-[3rem] leading-none font-bold text-ink">
                    Performance
                  </h3>
                  <p className="text-ink-secondary">Driven by data, refined by intelligence.</p>
                </div>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-8">
            <Card variant="glass" className="h-full p-10">
              <div className="flex flex-col gap-10 md:flex-row">
                <div className="md:w-1/2">
                  <AccentHeading icon={TrendingUp} accent="orchid" title="Digital Growth" />
                  <p className="mb-6 leading-relaxed text-ink-tertiary">
                    We don&rsquo;t just build; we accelerate. Our growth team uses advanced
                    analytics and behavioral science to scale your digital presence.
                  </p>
                  <ul className="flex flex-col gap-4">
                    {growthDisciplines.map((item) => (
                      <li key={item} className="flex items-center gap-3">
                        <span
                          className="size-2 shrink-0 rounded-full bg-chart-3"
                          style={{ boxShadow: "0 0 8px var(--chart-3)" }}
                          aria-hidden
                        />
                        <span className="text-[0.8125rem] font-semibold tracking-[0.05em] text-ink-secondary">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-line-subtle bg-surface-sunken p-6 md:w-1/2">
                  <div className="relative z-10">
                    <h4 className="mb-4 text-overline font-semibold tracking-(--text-overline--letter-spacing) text-ink-tertiary uppercase">
                      Impact Metrics
                    </h4>
                    <dl className="flex flex-col gap-6">
                      {impactMetrics.map((metric) => (
                        // dt/dd must be direct children of the single wrapper
                        // <div> that a <dl> permits.
                        <div
                          key={metric.label}
                          className="flex flex-wrap justify-between gap-x-3"
                        >
                          <dt className="text-xs font-semibold text-ink-secondary">
                            {metric.label}
                          </dt>
                          <dd data-tabular className={cn("text-xs font-semibold", metric.text)}>
                            {metric.value}
                          </dd>
                          {/* Decorative — the figure above carries the value. */}
                          <div
                            className="mt-2 h-1 w-full overflow-hidden rounded-full bg-line"
                            aria-hidden
                          >
                            <div
                              className={cn("h-full rounded-full", metric.bar)}
                              style={{ width: `${metric.fill}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <svg
                    className="absolute bottom-0 left-0 h-24 w-full opacity-20"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                    aria-hidden
                  >
                    <defs>
                      <linearGradient id="growth-area" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity="1" />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0 100 C 20 80, 40 90, 60 40 S 80 10, 100 30 L 100 100 L 0 100 Z"
                      fill="url(#growth-area)"
                    />
                  </svg>
                </div>
              </div>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-32 text-center md:px-10">
        <Card
          variant="glass"
          className="group relative overflow-hidden rounded-3xl border-brand/20 px-10 py-20"
        >
          <span
            className="absolute inset-0 bg-brand/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            aria-hidden
          />
          <div className="relative z-10">
            <h2 className="mb-8 font-heading text-[3rem] leading-none font-bold text-balance text-ink md:text-[4rem]">
              Ready to build the
              <br />
              <span className="text-brand">next generation?</span>
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Join the forward-thinking brands who trust us to engineer their digital future.
            </p>
            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Button size="xl" className="rounded-full" render={<Link href="/book-meeting" />}>
                Initiate Partnership
              </Button>
              <Button
                size="xl"
                variant="outline"
                className="rounded-full"
                render={<Link href="/case-studies" />}
              >
                View Our Lab
              </Button>
            </div>
          </div>
        </Card>
      </section>
    </>
  );
}

/* ── Local building blocks ─────────────────────────────────────────────── */

type Accent = "brand" | "ion" | "orchid";

/**
 * Three pillars, three accents. Taken from the validated categorical ramp
 * rather than the status palette, so the pillars stay distinguishable under
 * colour-blind simulation and none of them can be mistaken for a
 * success/warning state.
 */
const accentStyles: Record<Accent, { chipBg: string; chipFg: string }> = {
  brand: { chipBg: "bg-brand/20", chipFg: "text-brand" },
  ion: { chipBg: "bg-ion/20", chipFg: "text-ion" },
  orchid: { chipBg: "bg-chart-3/20", chipFg: "text-chart-3" },
};

function AccentHeading({
  icon: Icon,
  accent,
  title,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  title: string;
}) {
  const style = accentStyles[accent];
  return (
    <div className="mb-6 flex items-center gap-4">
      <span className={cn("grid size-12 place-items-center rounded-lg", style.chipBg)}>
        <Icon className={cn("size-5", style.chipFg)} />
      </span>
      <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">{title}</h2>
    </div>
  );
}

function PillarCard({
  icon,
  accent,
  title,
  body,
  watermark: Watermark,
  children,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  accent: Accent;
  title: string;
  body: string;
  watermark?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card
      variant="glass"
      interactive
      className={cn("group relative overflow-hidden p-10", className)}
    >
      {Watermark && (
        <span
          className="pointer-events-none absolute top-0 right-0 p-8 opacity-10 transition-opacity duration-(--duration-slow) group-hover:opacity-20"
          aria-hidden
        >
          <Watermark className="size-30 text-brand" />
        </span>
      )}
      <div className="relative z-10 flex flex-1 flex-col">
        <AccentHeading icon={icon} accent={accent} title={title} />
        <p className="mb-8 max-w-lg leading-relaxed text-ink-tertiary">{body}</p>
        {children}
      </div>
    </Card>
  );
}
