import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { RouteScaffold } from "@/components/shared/RouteScaffold";
import {
  Gauge,
  Headset,
  Layers,
  LayoutDashboard,
  Quote,
  Rocket,
  RefreshCcw,
  DraftingCompass,
  ScanSearch,
  Zap,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { RoiForecaster } from "@/components/services/RoiForecaster";
import { ServiceSectionNav } from "@/components/services/ServiceSectionNav";
import { StickyCtaBar } from "@/components/services/StickyCtaBar";
import { services as catalogue } from "@/lib/services";
import { services } from "./service-data";

const roadmapIcons = {
  audit: ScanSearch,
  architecture: DraftingCompass,
  sprints: RefreshCcw,
  handover: Rocket,
} as const;

const deliverableIcons = {
  layers: Layers,
  bolt: Zap,
  support: Headset,
  dashboard: LayoutDashboard,
} as const;

const toneClasses = {
  brand: { chip: "bg-brand/20 text-brand", text: "text-brand" },
  orchid: { chip: "bg-chart-3/20 text-chart-3", text: "text-chart-3" },
} as const;

type Props = { params: { slug: string } };

export function generateMetadata({ params }: Props): Metadata {
  const service = services[params.slug];
  if (!service) return { title: "Services detail" };
  return {
    title: `${service.title} ${service.titleAccent} Web Engineering`,
    description: service.blurb,
  };
}

export default function ServiceDetailPage({ params }: Props) {
  const service = services[params.slug];

  // Existence is decided by the catalogue; `service-data` only holds the
  // long-form copy. A catalogued service without copy keeps the scaffold —
  // 404-ing it would break the mega-menu links that point at it.
  const catalogued = catalogue.some((c) => c.slug === params.slug);
  if (!catalogued && !service) notFound();
  if (!service) {
    return <RouteScaffold title="Service" route={`/services/${params.slug}`} />;
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-40 md:px-10">
        <div className="grid gap-10 md:grid-cols-[5rem_1fr] xl:grid-cols-[16rem_1fr]">
          <ServiceSectionNav />

          <div className="min-w-0">
            {/* ── Hero + ROI ─────────────────────────────────────────────── */}
            <section
              id="roi"
              className="grid scroll-mt-28 grid-cols-1 items-center gap-16 py-20 lg:grid-cols-2"
            >
              <div className="flex flex-col gap-8">
                <Badge variant="brand" className="w-fit tracking-widest uppercase">
                  <span className="relative flex size-2" aria-hidden>
                    <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
                    <span className="relative size-2 rounded-full bg-brand" />
                  </span>
                  {service.eyebrow}
                </Badge>

                <h1 className="font-heading text-[3.5rem] leading-tight font-bold tracking-tight text-balance text-ink lg:text-[4.5rem]">
                  {service.title} <span className="text-brand">{service.titleAccent}</span> Web
                  Engineering
                </h1>

                <p className="max-w-lg text-lg leading-relaxed text-ink-secondary">
                  {service.blurb}
                </p>

                <ul className="flex flex-wrap gap-4">
                  {service.metrics.map((metric) => (
                    <li
                      key={metric.label}
                      className="glass flex items-center gap-2 rounded-lg px-4 py-2"
                    >
                      <Gauge className="size-4 shrink-0 text-ion" aria-hidden />
                      <span className="text-sm font-medium text-ink">{metric.label}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <RoiForecaster />
            </section>

            {/* ── Methodology ────────────────────────────────────────────── */}
            <section id="roadmap" className="scroll-mt-28 py-24">
              <div className="mb-20 text-center">
                <h2 className="mb-4 font-heading text-[2.5rem] leading-[1.2] font-semibold text-ink">
                  Technical <span className="text-brand">Methodology</span>
                </h2>
                <p className="mx-auto max-w-2xl text-ink-tertiary">
                  Our rigorous engineering approach ensures every line of code serves a purpose,
                  maximizing performance and developer experience.
                </p>
              </div>

              <ol className="mb-24 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
                {service.roadmap.map((phase) => {
                  const Icon = roadmapIcons[phase.icon];
                  return (
                    <li key={phase.step} className="group relative">
                      <span
                        className="pointer-events-none absolute -top-4 -left-4 font-heading text-[5rem] font-bold text-ink/5 transition-colors duration-(--duration-slow) group-hover:text-brand/10"
                        aria-hidden
                      >
                        {phase.step}
                      </span>
                      <Card
                        variant="glass"
                        className="h-full gap-4 rounded-xl p-8 transition-colors hover:border-brand/50"
                      >
                        <Icon className="size-8 text-brand" aria-hidden />
                        <h3 className="font-heading text-xl font-semibold text-ink">
                          <span className="sr-only">Step {phase.step}: </span>
                          {phase.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-ink-tertiary">{phase.body}</p>
                      </Card>
                    </li>
                  );
                })}
              </ol>

              <div id="stack" className="scroll-mt-28">
                <h3 className="sr-only">Tech stack and deliverables</h3>
                <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                  {service.deliverables.map((item) => {
                    const Icon = deliverableIcons[item.icon];
                    return (
                      <li key={item.title}>
                        <Card variant="glass" className="h-full flex-row gap-4 rounded-lg p-6">
                          <Icon className="size-5 shrink-0 text-brand" aria-hidden />
                          <div>
                            <p className="text-sm font-bold text-ink">{item.title}</p>
                            <p className="text-xs text-ink-tertiary">{item.note}</p>
                          </div>
                        </Card>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>

            {/* ── Proof ──────────────────────────────────────────────────── */}
            <section id="results" className="scroll-mt-28 py-24">
              <h2 className="mb-16 font-heading text-[2.5rem] leading-[1.2] font-semibold text-ink">
                Verified <span className="text-brand">Results</span>
              </h2>

              <div className="mb-32 grid grid-cols-1 gap-12 lg:grid-cols-2">
                {service.caseStudies.map((study) => {
                  const tone = toneClasses[study.tone];
                  return (
                    <article key={study.title} className="group relative">
                      <div className="relative h-100 overflow-hidden rounded-2xl">
                        <Image
                          src={study.image}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          className="object-cover transition-transform duration-700 ease-(--ease-out-quint) group-hover:scale-110"
                        />
                        <div
                          className="absolute inset-0 bg-gradient-to-t from-graphite-1000 via-graphite-1000/30 to-transparent"
                          aria-hidden
                        />
                        <div className="absolute right-6 bottom-6 left-6">
                          <span
                            className={cn(
                              "mb-3 inline-block rounded-full px-3 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md",
                              tone.chip
                            )}
                          >
                            {study.tag}
                          </span>
                          <h3 className="font-heading text-3xl font-semibold text-graphite-25">
                            <Link href={study.href} className="after:absolute after:inset-0">
                              {study.title}
                            </Link>
                          </h3>
                          <p className={cn("mt-2 text-xl font-bold", tone.text)}>
                            {study.result}
                          </p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              <ul className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {service.reviews.map((review) => (
                  <li key={review.name}>
                    <Card variant="glass" className="relative h-full rounded-xl p-8">
                      <Quote
                        className="absolute top-4 right-4 size-10 text-ink/5"
                        aria-hidden
                      />
                      <blockquote className="mb-6 leading-relaxed text-ink-secondary italic">
                        {review.quote}
                      </blockquote>
                      <figcaption className="flex items-center gap-4">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-sunken font-bold text-brand">
                          {review.name
                            .split(" ")
                            .map((w) => w[0])
                            .join("")}
                        </span>
                        <span>
                          <span className="block text-sm font-bold text-ink">{review.name}</span>
                          <span className="block text-[0.625rem] tracking-wider text-ink-tertiary uppercase">
                            {review.role}
                          </span>
                        </span>
                      </figcaption>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </div>

      <StickyCtaBar price={service.price} availability={service.availability} />
    </>
  );
}
