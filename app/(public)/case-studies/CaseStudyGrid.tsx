"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/Reveal";
import {
  industries,
  serviceFilters,
  studies,
  type Layout,
  type Metric,
} from "@/lib/case-studies";

const spans: Record<Layout, string> = {
  featured: "md:col-span-8",
  stacked: "md:col-span-4",
  split: "md:col-span-6",
};

const toneText = {
  brand: "text-brand",
  ion: "text-ion",
  orchid: "text-chart-3",
} as const;

function Metrics({ metrics, size = "md" }: { metrics: Metric[]; size?: "md" | "sm" }) {
  return (
    <dl className={cn("flex", size === "md" ? "gap-8" : "gap-6")}>
      {metrics.map((metric) => (
        <div key={metric.label}>
          <dd
            data-tabular
            className={cn(
              "font-bold",
              size === "md" ? "text-2xl" : "text-xl",
              toneText[metric.tone]
            )}
          >
            {metric.value}
          </dd>
          <dt
            className={cn(
              "tracking-widest text-ink-tertiary uppercase",
              size === "md" ? "text-[0.625rem]" : "text-[0.5625rem]"
            )}
          >
            {metric.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

function FilterRow({
  label,
  options,
  active,
  onChange,
}: {
  label: string;
  options: string[];
  active: string;
  onChange: (value: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap items-center gap-4">
      <span className="text-[0.8125rem] font-semibold tracking-widest text-ink-tertiary uppercase">
        {label}:
      </span>
      {options.map((option) => {
        const selected = active === option;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[0.8125rem] font-semibold transition-colors duration-(--duration-fast)",
              "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
              selected
                ? "border border-brand/40 bg-brand/20 text-brand"
                : "text-ink-tertiary hover:bg-surface-sunken hover:text-ink"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

export function CaseStudyGrid() {
  const [industry, setIndustry] = React.useState<string>("All Sectors");
  const [service, setService] = React.useState<string>("All Services");

  const shown = React.useMemo(
    () =>
      studies.filter(
        (s) =>
          (industry === "All Sectors" || s.industry === industry) &&
          (service === "All Services" || s.service === service)
      ),
    [industry, service]
  );

  return (
    <>
      <section className="mb-12">
        <Card variant="glass" className="gap-6 rounded-xl p-6">
          <FilterRow
            label="Industry"
            options={industries}
            active={industry}
            onChange={setIndustry}
          />
          <FilterRow
            label="Service"
            options={serviceFilters}
            active={service}
            onChange={setService}
          />
        </Card>
        <p aria-live="polite" className="sr-only">
          Showing {shown.length} of {studies.length} case studies.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {shown.map((study, i) => (
          <Reveal key={study.id} delay={i * 70} className={cn("h-full", spans[study.layout])}>
            <Card
              variant="glass"
              interactive
              className={cn(
                "group h-full overflow-hidden rounded-2xl",
                study.featured && "border-beam"
              )}
            >
              {study.layout === "featured" && (
                <div className="flex h-full min-h-125 flex-col md:flex-row">
                  <div className="flex w-full flex-col justify-between p-10 md:w-1/2">
                    <div>
                      <div className="mb-6 flex gap-2">
                        <span className="rounded bg-brand/20 px-2 py-0.5 text-[0.625rem] font-bold tracking-widest text-brand uppercase">
                          Featured
                        </span>
                        <span className="rounded bg-surface-sunken px-2 py-0.5 text-[0.625rem] font-bold tracking-widest text-ink-secondary uppercase">
                          {study.industry}
                        </span>
                      </div>
                      <h2 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                        <Link href={study.href} className="after:absolute after:inset-0">
                          {study.title}
                        </Link>
                      </h2>
                      <p className="mb-8 line-clamp-3 leading-relaxed text-ink-tertiary">
                        {study.blurb}
                      </p>
                    </div>
                    <Metrics metrics={study.metrics} />
                  </div>
                  <div className="relative min-h-64 w-full overflow-hidden bg-surface-sunken md:w-1/2">
                    <Image
                      src={study.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-(--ease-out-quint) group-hover:scale-110"
                    />
                  </div>
                </div>
              )}

              {study.layout === "stacked" && (
                <div className="flex h-full flex-col">
                  <div className="relative h-64 overflow-hidden bg-surface-sunken">
                    <Image
                      src={study.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 33vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-(--ease-out-quint) group-hover:scale-110"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-8">
                    <p className="mb-3 text-[0.625rem] font-bold tracking-[0.2em] text-brand uppercase">
                      {study.industry}
                    </p>
                    <h2 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                      <Link href={study.href} className="after:absolute after:inset-0">
                        {study.title}
                      </Link>
                    </h2>
                    <p className="mb-6 flex-1 leading-relaxed text-ink-tertiary">
                      {study.blurb}
                    </p>
                    <div className="border-t border-line-subtle pt-6">
                      <Metrics metrics={study.metrics} size="sm" />
                    </div>
                  </div>
                </div>
              )}

              {study.layout === "split" && (
                <div className="flex h-full flex-col md:flex-row">
                  <div className="relative h-64 w-full overflow-hidden bg-surface-sunken md:h-auto md:w-2/5">
                    <Image
                      src={study.image}
                      alt=""
                      fill
                      sizes="(min-width: 768px) 25vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-(--ease-out-quint) group-hover:scale-110"
                    />
                  </div>
                  <div className="w-full p-8 md:w-3/5">
                    <p className="mb-3 text-[0.625rem] font-bold tracking-[0.2em] text-brand uppercase">
                      {study.industry}
                    </p>
                    <h2 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                      <Link href={study.href} className="after:absolute after:inset-0">
                        {study.title}
                      </Link>
                    </h2>
                    <p className="mb-6 leading-relaxed text-ink-tertiary">{study.blurb}</p>
                    <Metrics metrics={study.metrics} size="sm" />
                  </div>
                </div>
              )}
            </Card>
          </Reveal>
        ))}

        {shown.length === 0 && (
          <p className="col-span-full rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-ink-tertiary">
            No case studies match that combination.{" "}
            <button
              type="button"
              onClick={() => {
                setIndustry("All Sectors");
                setService("All Services");
              }}
              className="font-semibold text-brand underline-offset-4 hover:underline"
            >
              Clear filters
            </button>
          </p>
        )}
      </section>
    </>
  );
}
