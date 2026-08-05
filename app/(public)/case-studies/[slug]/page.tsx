import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPage } from "@/lib/supabase/page-actions";

import { RouteScaffold } from "@/components/shared/RouteScaffold";
import {
  CheckCircle2,
  Cpu,
  Lightbulb,
  Quote,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { studies } from "@/lib/case-studies";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AmbientParallax } from "@/components/marketing/AmbientParallax";
import { BeforeAfterSlider } from "@/components/case-studies/BeforeAfterSlider";

type Props = { params: { slug: string } };

const toneText = {
  brand: "text-brand",
  ion: "text-ion",
  orchid: "text-chart-3",
} as const;

export function generateStaticParams() {
  return studies.filter((s) => s.detail).map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cms = await getPublishedPage(`case-studies/${params.slug}`);
  if (cms) {
    const seo = cms.seo as { title?: string; description?: string };
    return { title: seo.title || cms.title, description: seo.description };
  }

  const study = studies.find((s) => s.slug === params.slug);
  if (!study?.detail) return { title: "Case study" };
  return { title: study.detail.headline, description: study.blurb };
}

export default async function CaseStudyDetailPage({ params }: Props) {
  // A CMS case study wins. Checking first means an editor can publish a new one
  // without a developer, and can replace a hand-built study by publishing at
  // the same slug — while every link already in the archive keeps working.
  const cms = await getPublishedPage(`case-studies/${params.slug}`);
  if (cms) {
    return (
      <main>
        <BlockRenderer blocks={cms.blocks} />
      </main>
    );
  }

  const study = studies.find((s) => s.slug === params.slug);

  // Unknown slug is not found. A real study whose long-form content is not
  // written yet still resolves — it is linked from the archive.
  if (!study) notFound();
  if (!study.detail) {
    return <RouteScaffold title={study.title} route={`/case-studies/${study.slug}`} />;
  }

  const d = study.detail;

  return (
    <>
      <AmbientParallax />

      <div className="mx-auto flex max-w-7xl flex-col gap-32 px-4 pt-12 pb-24 md:px-10">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <header className="grid grid-cols-1 items-end gap-6 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <p className="mb-6 flex items-center gap-4">
              <span className="grid size-16 shrink-0 place-items-center rounded-xl border border-line bg-surface-sunken font-heading text-xl font-bold text-brand">
                {study.shortTitle
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <span className="text-[0.8125rem] font-semibold tracking-widest text-ion uppercase">
                {d.discipline}
              </span>
            </p>
            <h1 className="font-heading text-display leading-none font-bold tracking-tight text-balance text-ink">
              {d.headline}
            </h1>
          </div>

          <dl className="grid grid-cols-1 gap-6 border-t border-line pt-12 md:grid-cols-3 lg:col-span-12">
            {d.heroMetrics.map((metric, i) => (
              <Card
                key={metric.label}
                variant="glass"
                className={cn("rounded-xl p-8", i === 0 && "border-beam")}
              >
                <dd
                  data-tabular
                  className={cn(
                    "mb-2 font-heading text-[3rem] leading-none font-bold",
                    toneText[metric.tone]
                  )}
                >
                  {metric.value}
                </dd>
                <dt className="text-[0.8125rem] font-semibold tracking-wide text-ink-tertiary uppercase">
                  {metric.label}
                </dt>
              </Card>
            ))}
          </dl>
        </header>

        {/* ── Challenge ─────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-6 lg:col-span-5">
            <p className="flex items-center gap-2 text-brand">
              <TriangleAlert className="size-5" aria-hidden />
              <span className="text-[0.8125rem] font-semibold tracking-widest uppercase">
                The Challenge
              </span>
            </p>
            <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              {d.challenge.heading}
            </h2>
            <p className="text-lg leading-relaxed text-ink-tertiary">{d.challenge.body}</p>
            <ul className="flex flex-col gap-4">
              {d.challenge.points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 size-4 shrink-0 text-brand" aria-hidden />
                  <span className="text-ink-secondary">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7">
            <div className="glass relative aspect-video w-full overflow-hidden rounded-2xl">
              <Image
                src={d.challenge.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover opacity-60"
              />
            </div>
          </div>
        </section>

        {/* ── Before / after ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-8">
          <div className="mx-auto max-w-2xl space-y-4 text-center">
            <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              Nexus-Engineered Evolution
            </h2>
            <p className="text-ink-tertiary">
              Drag the handle — or focus it and use the arrow keys — to compare the legacy
              platform with the rebuild.
            </p>
          </div>
          <BeforeAfterSlider before={d.comparison.before} after={d.comparison.after} />
        </section>

        {/* ── Solution + execution ──────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card variant="glass" className="gap-8 rounded-3xl p-10">
            <p className="flex items-center gap-2 text-ion">
              <Lightbulb className="size-5" aria-hidden />
              <span className="text-[0.8125rem] font-semibold tracking-widest uppercase">
                The Strategic Solution
              </span>
            </p>
            <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              {d.solution.heading}
            </h2>
            <p className="leading-relaxed text-ink-tertiary">{d.solution.body}</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {d.solution.pillars.map((pillar) => (
                <div
                  key={pillar.title}
                  className="rounded-xl border border-line bg-surface-sunken p-4"
                >
                  <p className="mb-1 font-bold text-ion">{pillar.title}</p>
                  <p className="text-xs text-ink-tertiary">{pillar.body}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card variant="glass" className="gap-8 rounded-3xl p-10">
            <p className="flex items-center gap-2 text-chart-3">
              <Cpu className="size-5" aria-hidden />
              <span className="text-[0.8125rem] font-semibold tracking-widest uppercase">
                Execution &amp; Architecture
              </span>
            </p>
            <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              {d.execution.heading}
            </h2>
            <p className="leading-relaxed text-ink-tertiary">{d.execution.body}</p>
            <ul className="flex flex-wrap gap-2">
              {d.execution.stack.map((tech) => (
                <li
                  key={tech}
                  className="glass rounded-full border-chart-3/30 px-4 py-2 text-xs font-semibold text-chart-3"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── Testimonial ───────────────────────────────────────────────── */}
        <section className="relative py-20">
          <span
            className="pointer-events-none absolute inset-0 rounded-[4rem] bg-brand/5 blur-3xl"
            aria-hidden
          />
          <Card
            variant="glass"
            className="relative flex-row flex-wrap items-center justify-center gap-12 rounded-[3rem] p-12 md:p-20"
          >
            <div className="relative size-48 shrink-0">
              <span
                className="absolute inset-0 scale-110 rounded-full border-2 border-brand/30"
                aria-hidden
              />
              <Image
                src={d.testimonial.portrait}
                alt=""
                fill
                sizes="192px"
                className="rounded-full object-cover"
              />
              <span className="absolute -right-2 -bottom-2 grid size-12 place-items-center rounded-full bg-brand">
                <Quote className="size-5 text-brand-fg" aria-hidden />
              </span>
            </div>

            <figure className="flex min-w-72 flex-1 flex-col gap-8">
              <blockquote className="font-heading text-[2rem] leading-tight font-semibold text-balance text-ink italic md:text-[2.5rem]">
                &ldquo;{d.testimonial.quote}&rdquo;
              </blockquote>
              <figcaption>
                <p className="text-xl font-bold tracking-widest text-brand uppercase">
                  {d.testimonial.name}
                </p>
                <p className="mt-2 text-[0.8125rem] font-semibold tracking-wider text-ink-tertiary uppercase">
                  {d.testimonial.role}
                </p>
              </figcaption>
            </figure>
          </Card>
        </section>

        {/* ── Services + CTA ────────────────────────────────────────────── */}
        <section className="flex flex-col gap-12 text-center">
          <div className="space-y-4">
            <h2 className="font-heading text-[3rem] leading-[1.2] font-bold text-ink">
              Services Deployed
            </h2>
            <ul className="flex flex-wrap justify-center gap-4">
              {d.servicesDeployed.map((service) => (
                <li
                  key={service}
                  className="glass rounded-xl border-brand/20 px-8 py-4 text-[0.8125rem] font-semibold tracking-wider text-brand"
                >
                  {service}
                </li>
              ))}
            </ul>
          </div>

          <Card
            variant="glass"
            className="border-beam mx-auto max-w-4xl items-center gap-8 rounded-[4rem] p-16"
          >
            <h2 className="font-heading text-display leading-tight font-bold text-ink">
              Ready to scale?
            </h2>
            <p className="mx-auto max-w-xl text-lg leading-relaxed text-ink-secondary">
              Every legacy system is a bottleneck waiting to be broken. Let&rsquo;s discuss your
              architectural evolution today.
            </p>
            <Button size="xl" className="rounded-full px-12" render={<Link href="/contact" />}>
              Achieve Similar Results
              <TrendingUp />
            </Button>
          </Card>
        </section>
      </div>
    </>
  );
}
