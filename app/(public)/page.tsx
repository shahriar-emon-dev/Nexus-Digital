import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getMarketingStats } from "@/lib/supabase/marketing-stats";
import { getSiteSettings } from "@/lib/supabase/nav-actions";
import { getPublishedPage } from "@/lib/supabase/page-actions";
import { createClient } from "@/lib/supabase/server";
import {
  ArrowRight,
  ChevronRight,
  Cloud,
  Code2,
  Lightbulb,
  Network,
  Palette,
  Phone,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CountUp } from "@/components/marketing/CountUp";
import { HeroParallax } from "@/components/marketing/HeroParallax";
import { Reveal } from "@/components/marketing/Reveal";
import { Spotlight } from "@/components/marketing/Spotlight";

export const metadata: Metadata = {
  title: "Nexus Digital Agency — Engineering the Future of Digital",
  description:
    "Nexus is a technical-led digital agency specializing in immersive experiences and high-performance engineering. We bridge the gap between imagination and execution.",
};

/**
 * Three capabilities, three accents — drawn from the validated categorical ramp
 * rather than the status palette, so none of them can read as a success or
 * warning state and all three stay separable under colour-blind simulation.
 */
const capabilities = [
  {
    icon: Lightbulb,
    accent: "brand",
    title: "Digital Strategy",
    body: "Data-driven frameworks designed to align your brand with the evolving digital landscape.",
    cta: "Discover process",
    href: "/services",
    offset: false,
  },
  {
    icon: Palette,
    accent: "ion",
    title: "UI/UX Design",
    body: "Crafting high-fidelity, immersive interfaces that prioritize user clarity and emotional connection.",
    cta: "View projects",
    href: "/case-studies",
    offset: true,
  },
  {
    icon: Code2,
    accent: "orchid",
    title: "Full-stack Development",
    body: "Robust, scalable architecture built for speed and longevity across all platforms.",
    cta: "Tech stack",
    href: "/services/web-development",
    offset: false,
  },
] as const;

const stack = [
  { icon: Cloud, name: "Forge" },
  { icon: Zap, name: "Velocity" },
  { icon: Network, name: "Nexus_OS" },
  { icon: ShieldCheck, name: "Shield" },
];

export default async function HomePage() {
  // An administrator can nominate any published page as the site homepage. When
  // one is set it answers "/" through the same renderer the CMS uses; otherwise
  // the built-in marketing homepage below is served, so the site is never blank.
  const [settings, stats] = await Promise.all([getSiteSettings(), getMarketingStats()]);
  if (settings.homepage_page_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("pages")
      .select("slug")
      .eq("id", settings.homepage_page_id)
      .eq("status", "published")
      .maybeSingle();

    if (data?.slug) {
      const page = await getPublishedPage(data.slug as string);
      if (page) return <BlockRenderer blocks={page.blocks} />;
    }
  }

  return (
    <>
      <div className="noise-field" aria-hidden />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {/* The shell already offsets the fixed header; this only needs breathing room. */}
      <header className="relative flex items-center overflow-hidden px-4 pt-10 pb-24 md:px-10 lg:min-h-[860px]">
        <span
          className="bloom -top-50 -left-25 size-150 bg-brand/15 blur-[80px]"
          aria-hidden
        />
        <span
          className="bloom -right-25 -bottom-25 size-125 bg-ion/12 blur-[100px]"
          aria-hidden
        />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <HeroParallax className="lg:col-span-7">
            <p className="mb-8 inline-flex items-center gap-2 rounded-full border border-brand/20 bg-brand/10 px-4 py-1.5">
              <span className="relative flex size-2" aria-hidden>
                <span className="absolute inset-0 animate-ping rounded-full bg-ion opacity-70 motion-reduce:animate-none" />
                <span className="relative size-2 rounded-full bg-ion" />
              </span>
              <span className="text-[0.8125rem] font-semibold tracking-[0.1em] text-brand uppercase">
                Now accepting projects
              </span>
            </p>

            <h1 className="mb-6 font-heading text-display leading-tight font-bold text-balance text-ink">
              Engineering the <br />
              <span className="bg-gradient-to-r from-brand to-ion bg-clip-text text-transparent">
                Future of Digital
              </span>
            </h1>

            <p className="mb-10 max-w-xl text-lg leading-relaxed text-ink-secondary">
              Nexus is a technical-led digital agency specializing in immersive experiences and
              high-performance engineering. We bridge the gap between imagination and execution.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Button size="xl" render={<Link href="/case-studies" />}>
                View Work
                <ArrowRight />
              </Button>
              <Button size="xl" variant="outline" render={<Link href="/services" />}>
                Our Services
              </Button>
            </div>
          </HeroParallax>

          <div className="hidden lg:col-span-5 lg:block">
            <div className="group relative">
              <span
                className="absolute inset-0 rounded-3xl bg-brand/20 blur-3xl transition-colors duration-500 group-hover:bg-ion/30"
                aria-hidden
              />
              <div className="glass relative aspect-square overflow-hidden rounded-3xl p-4">
                {/* TODO: swap for a hosted asset — this URL is from the design
                    tool's CDN and will expire. */}
                <div className="relative size-full overflow-hidden rounded-2xl">
                  <Image
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBXbnWGVJ4mx9iaoIz7Ft6mVZu-jzQG2AgPZTwNV-gKmtAdqm8r9ExGCgPLkR3KjUSqNh9iE4JXno1_2zSn49EUXNKFI14-ny8bxQV5_gRBgtBgDJUO5OuHzB90QwgICDw9lWEpf3VBkVGdGJKaEY4-H2tIXHWIaEnJskJEElLNfWUJErg1Sn_VZRFiw5efQ0xrT-4JK8u8KG8Suke0RKQqKbADZ-TgMFvLPV6HmjGdSfErkwGmouK1KqnRzRs9tV0ntxsWxPQx8n71"
                    alt=""
                    fill
                    priority
                    sizes="(min-width: 1024px) 480px, 0px"
                    className="object-cover grayscale transition-[filter] duration-700 group-hover:grayscale-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Core capabilities ────────────────────────────────────────────── */}
      <section className="relative bg-surface-sunken px-4 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="mb-4 font-heading text-[3rem] leading-[1.2] font-bold tracking-tight text-balance text-ink">
                Core Capabilities
              </h2>
              <p className="max-w-lg leading-relaxed text-ink-tertiary">
                We leverage cutting-edge technology stacks to deliver scalable solutions that
                drive measurable business growth.
              </p>
            </div>
            <div className="flex gap-2" aria-hidden>
              <span className="h-1 w-12 rounded-full bg-brand" />
              <span className="h-1 w-4 rounded-full bg-line-strong" />
              <span className="h-1 w-4 rounded-full bg-line-strong" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {capabilities.map((item, i) => (
              <Reveal
                key={item.title}
                delay={i * 90}
                className={cn("h-full", item.offset && "md:translate-y-8")}
              >
                <Spotlight className="h-full rounded-[2rem]">
                  <Card
                    variant="glass"
                    interactive
                    className="group h-full rounded-[2rem] p-10"
                  >
                    <Link
                      href={item.href}
                      className="relative z-10 flex h-full flex-col justify-between focus:outline-none"
                    >
                      <div>
                        <span
                          className={cn(
                            "mb-8 grid size-14 place-items-center rounded-2xl transition-colors duration-(--duration-normal)",
                            accentChip[item.accent]
                          )}
                        >
                          <item.icon className={cn("size-7", accentText[item.accent])} />
                        </span>
                        <h3 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                          {item.title}
                        </h3>
                        <p className="leading-relaxed text-ink-tertiary">{item.body}</p>
                      </div>
                      <span
                        className={cn(
                          "mt-12 inline-flex items-center gap-2 text-[0.8125rem] font-semibold tracking-[0.05em] uppercase",
                          "transition-transform duration-(--duration-normal) group-hover:translate-x-2",
                          accentText[item.accent]
                        )}
                      >
                        {item.cta}
                        <ChevronRight className="size-4" aria-hidden />
                      </span>
                    </Link>
                  </Card>
                </Spotlight>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Metrics ──────────────────────────────────────────────────────── */}
      <section className="overflow-hidden px-4 py-24 md:px-10">
        <div className="mx-auto max-w-7xl">
          <Reveal>
            <Card
              variant="glass"
              className="relative overflow-hidden rounded-[2.5rem] p-12 md:p-20"
            >
              {/* A plain grid, not a <dl>: these are stat tiles, not term/definition
                  pairs — CountUp emits no <dt>/<dd>, so a <dl> here is invalid
                  markup that screen readers announce as an empty list. */}
              <div className="relative z-10 grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                  <CountUp
                    key={stat.label}
                    value={stat.value}
                    suffix={stat.suffix}
                    label={stat.label}
                    decimalPlaces={stat.decimalPlaces ?? 0}
                    tone={stat.tone}
                    size="display"
                    align="center"
                    className="lg:items-start lg:text-left"
                  />
                ))}
              </div>

              <ul className="mt-20 flex flex-wrap justify-center gap-12 opacity-60 grayscale transition-[filter,opacity] duration-700 hover:opacity-100 hover:grayscale-0">
                {stack.map(({ icon: Icon, name }) => (
                  <li key={name} className="flex h-8 items-center gap-2">
                    <Icon className="size-8 text-ink-secondary" aria-hidden />
                    <span className="text-[0.8125rem] font-semibold tracking-[0.05em] text-ink-secondary uppercase">
                      {name}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      {/* `overflow-hidden` is load-bearing: the decorative rings are 800px and
          600px wide, so on a phone they extend well past the viewport and
          create a horizontal scrollbar into dead space. */}
      <section className="relative overflow-hidden px-4 py-32 md:px-10">
        <span
          className="pointer-events-none absolute top-1/2 left-1/2 size-200 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-subtle opacity-30"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute top-1/2 left-1/2 size-150 -translate-x-1/2 -translate-y-1/2 rounded-full border border-line-subtle opacity-20"
          aria-hidden
        />

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-8 font-heading text-display leading-tight font-bold text-balance text-ink">
            Ready to Build the <span className="text-ion">Next Big Thing?</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-ink-secondary">
            Join 50+ visionary companies who have partnered with Nexus to scale their digital
            infrastructure and product design.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <Button size="xl" className="rounded-full px-12" render={<Link href="/contact" />}>
              Get Started Now
            </Button>
            <Button size="xl" variant="ghost" render={<Link href="/book-meeting" />}>
              Schedule a Call
              <Phone />
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

const accentChip = {
  brand: "bg-brand/10 group-hover:bg-brand/20",
  ion: "bg-ion/10 group-hover:bg-ion/20",
  orchid: "bg-chart-3/10 group-hover:bg-chart-3/20",
} as const;

const accentText = {
  brand: "text-brand",
  ion: "text-ion",
  orchid: "text-chart-3",
} as const;
