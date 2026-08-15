import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowRight, Calculator } from "lucide-react";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RoiForecaster } from "@/components/services/RoiForecaster";
import { StickyCtaBar } from "@/components/services/StickyCtaBar";
import { getPublicService } from "@/lib/supabase/service-actions";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/seo/JsonLd";

/**
 * A service detail page is a published CMS page and nothing else.
 *
 * It used to be three overlapping sources: a hardcoded catalogue (lib/services),
 * a file of long-form copy for a single slug (service-data), and the CMS. Only
 * the CMS could be edited without a developer, and the other two carried
 * invented proof — named testimonials from people who do not exist, case study
 * results nobody measured, "99.9% uptime". Both files are gone.
 *
 * A draft or archived service now 404s instead of rendering a placeholder. That
 * is the point: an unpublished service is one the agency is not yet selling,
 * and a scaffold reading "Service" told a visitor nothing while implying the
 * page was merely broken.
 */

type Props = { params: { slug: string } };

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = await getPublicService(params.slug);
  if (!service) return { title: "Service not found" };

  const seo = service.seo as { title?: string; description?: string };
  return {
    title: seo.title || service.title,
    description: seo.description || service.summary || undefined,
  };
}

export default async function ServiceDetailPage({ params }: Props) {
  const service = await getPublicService(params.slug);
  if (!service) notFound();

  return (
    <>
      {/* Spec §15.3. `offers` is omitted when no price is set — a zero-price
          Offer in structured data is a claim that the work is free. */}
      <JsonLd
        data={serviceLd({
          name: service.title,
          slug: params.slug,
          description: service.summary,
          priceFrom: service.priceFrom,
          currency: service.currency,
        })}
      />
      <JsonLd
        data={breadcrumbLd([
          { name: "Services", url: "/services" },
          { name: service.title, url: `/services/${params.slug}` },
        ])}
      />
      <main>
        <BlockRenderer blocks={service.blocks} />

        {/* The forecaster is a calculator, not a claim: it projects from figures
            the reader enters, against assumptions stated on its own face. It is
            appended by the route rather than authored as a block because every
            service benefits from it and no editor should have to remember. */}
        <section id="roi" className="mx-auto max-w-7xl scroll-mt-28 px-4 py-24 md:px-10">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div className="flex flex-col gap-6">
              <Badge variant="brand" className="w-fit tracking-widest uppercase">
                <Calculator className="size-3.5" aria-hidden />
                Model the return
              </Badge>

              <h2 className="font-heading text-[2.5rem] leading-[1.15] font-semibold text-balance text-ink">
                What this could be <span className="text-brand">worth</span>
              </h2>

              <p className="max-w-lg text-lg leading-relaxed text-ink-secondary">
                Enter your own traffic and conversion rate. Everything below is
                projected from those two numbers and the assumptions shown — we
                have not substituted a result from somebody else&rsquo;s project.
              </p>

              <Button
                size="lg"
                variant="outline"
                className="w-fit rounded-xl"
                render={<Link href="/contact" />}
              >
                Ask us to check these numbers
                <ArrowRight />
              </Button>
            </div>

            <RoiForecaster />
          </div>
        </section>
      </main>

      {service.priceFrom !== null && (
        <StickyCtaBar
          price={money.format(service.priceFrom)}
          leadTime={
            service.leadTimeWeeks
              ? `${service.leadTimeWeeks} weeks`
              : "Scoped per engagement"
          }
        />
      )}
    </>
  );
}
