import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

import { listServiceCatalogue } from "@/lib/supabase/service-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CursorTrail } from "@/components/marketing/CursorTrail";
import { Reveal } from "@/components/marketing/Reveal";
import { EmptyState } from "@/components/shared/EmptyState";

export const metadata: Metadata = {
  title: "Services",
  description:
    "We combine technical mastery with creative intuition to build software, brands, and digital strategies that redefine industries.",
};




/**
 * What this engagement produces, rather than what it supposedly achieved.
 *
 * This panel used to read "Retention Rate +42% · User Engagement +68% · Load
 * Speed −1.2s" against filled progress bars. Those are client outcomes, stated
 * as fact on a public sales page, and nothing measured any of them. Deliverables
 * are things the agency actually hands over, so they are safe to name.
 */
const engagementIncludes = [
  "Measurement plan agreed before build",
  "Baseline captured from your own analytics",
  "Post-launch report against that baseline",
];

export default async function ServicesPage() {
  const services = await listServiceCatalogue();

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

      {/* ── Catalogue ────────────────────────────────────────────────────── */}
      {/*
        This section used to be a hardcoded bento of three invented pillars —
        "Brand Identity", "Web Capabilities", "Growth Disciplines" — built from
        four local arrays, illustrated with design-tool CDN URLs that expire,
        and linking only to /case-studies, /contact and /book-meeting. Nine
        service pages existed in the CMS, five of them published, and the page
        whose entire job is to list them contained no link to a single one. A
        visitor could only reach a service through the header dropdown.

        It now renders the published catalogue. Publishing a service in the
        admin puts it here; unpublishing removes it; reordering reorders it.
      */}
      <section className="mx-auto max-w-7xl px-4 py-20 md:px-10">
        {services.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="No services are published yet"
            description="Service pages are written and published from the admin content area. Published services appear here automatically."
            action={
              <Button size="lg" className="rounded-full" render={<Link href="/contact" />}>
                Tell us what you need
              </Button>
            }
          />
        ) : (
          <>
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                What we do
              </h2>
              <p className="text-sm text-ink-tertiary">
                <span data-tabular>{services.length}</span>{" "}
                {services.length === 1 ? "service" : "services"}
              </p>
            </div>

            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <li key={service.slug} className="h-full">
                  <Reveal delay={Math.min(i, 5) * 60} className="h-full">
                    <Card variant="glass" interactive className="group h-full overflow-hidden">
                      <Link
                        href={`/services/${service.slug}`}
                        className="flex h-full flex-col focus:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
                      >
                        {service.coverImageUrl && (
                          <div className="relative h-44 shrink-0">
                            <Image
                              src={service.coverImageUrl}
                              alt={service.coverImageAlt ?? ""}
                              fill
                              sizes="(min-width: 1024px) 380px, (min-width: 768px) 50vw, 100vw"
                              className="object-cover"
                            />
                            <div
                              className="absolute inset-0 bg-gradient-to-t from-surface to-transparent"
                              aria-hidden
                            />
                          </div>
                        )}

                        <div className="flex flex-1 flex-col gap-3 p-6">
                          <div className="flex flex-wrap items-center gap-2">
                            {service.category && (
                              <Badge variant="outline" className="text-[0.6875rem]">
                                {service.category}
                              </Badge>
                            )}
                            {service.isFeatured && (
                              <Badge className="text-[0.6875rem]">Featured</Badge>
                            )}
                          </div>

                          <h3 className="font-heading text-xl leading-snug font-semibold text-ink">
                            {service.title}
                          </h3>

                          {/* Absent rather than filled with invented copy when
                              an editor has not written a summary yet. */}
                          {service.summary && (
                            <p className="line-clamp-3 text-sm leading-relaxed text-ink-tertiary">
                              {service.summary}
                            </p>
                          )}

                          <dl className="mt-auto flex flex-wrap items-baseline gap-x-6 gap-y-1 pt-4 text-sm">
                            <div className="flex items-baseline gap-1.5">
                              <dt className="sr-only">Starting price</dt>
                              <dd data-tabular className="font-semibold text-ink">
                                {service.priceFrom === null
                                  ? "Talk to us"
                                  : `From ${new Intl.NumberFormat("en-US", {
                                      style: "currency",
                                      currency: service.currency,
                                      maximumFractionDigits: 0,
                                    }).format(service.priceFrom)}`}
                              </dd>
                            </div>
                            {service.leadTimeWeeks !== null && (
                              <div className="flex items-baseline gap-1.5">
                                <dt className="text-ink-tertiary">Lead time</dt>
                                <dd data-tabular className="text-ink-secondary">
                                  {service.leadTimeWeeks}w
                                </dd>
                              </div>
                            )}
                          </dl>

                          <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-brand">
                            View service
                            <ArrowRight
                              className="size-4 transition-transform duration-(--duration-fast) group-hover:translate-x-1"
                              aria-hidden
                            />
                          </span>
                        </div>
                      </Link>
                    </Card>
                  </Reveal>
                </li>
              ))}
            </ul>

            {/* Deliverables the agency actually hands over. This list replaced a
                panel reading "Retention Rate +42% · User Engagement +68%" —
                client outcomes stated as fact on a sales page, measured by
                nothing. */}
            <Card variant="glass" className="mt-16 gap-4 rounded-2xl p-8">
              <h3 className="font-heading text-lg font-semibold text-ink">
                Every engagement includes
              </h3>
              <ul className="grid gap-3 sm:grid-cols-3">
                {engagementIncludes.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-ink-secondary">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
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
