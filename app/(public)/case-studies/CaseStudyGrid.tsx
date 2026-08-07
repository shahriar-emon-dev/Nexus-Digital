"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { FolderSearch, MoveRight } from "lucide-react";

import type { ContentCard } from "@/lib/supabase/content-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/Reveal";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/**
 * Published case studies from the CMS.
 *
 * The grid this replaces rendered four fictional clients from a static module,
 * each with invented results — "420% Throughput Increase" for a bank that does
 * not exist. Those were not migrated: a case study is a claim about work
 * actually done, and the honest source is a real project with a case study page
 * attached to it.
 *
 * The filter is built from the categories present, so it can never offer one
 * that matches nothing.
 */
export function CaseStudyGrid({ studies }: { studies: ContentCard[] }) {
  const [category, setCategory] = React.useState<string>("All");

  const categories = React.useMemo(
    () => ["All", ...new Set(studies.map((s) => s.category).filter((c): c is string => Boolean(c)))],
    [studies]
  );

  const shown = React.useMemo(
    () => (category === "All" ? studies : studies.filter((s) => s.category === category)),
    [studies, category]
  );

  if (studies.length === 0) {
    return (
      <section className="mx-auto max-w-3xl px-4 py-24 text-center md:px-10">
        <span className="mx-auto mb-5 grid size-14 place-items-center rounded-full bg-brand/10">
          <FolderSearch className="size-7 text-brand" aria-hidden />
        </span>
        <h2 className="font-heading text-[2rem] leading-tight font-semibold text-ink">
          No case studies published yet
        </h2>
        <p className="mx-auto mt-4 max-w-md text-lg text-ink-tertiary">
          We publish these from real delivered projects, with the client&rsquo;s agreement.
          Nothing is here until there is something true to show.
        </p>
        <Button className="mt-8 rounded-xl" render={<Link href="/contact" />}>
          Talk to us about your project
          <MoveRight />
        </Button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 md:px-10">
      {categories.length > 1 && (
        <div className="mb-10 flex flex-wrap items-center gap-4">
          <label htmlFor="cs-category" className="text-[0.8125rem] text-ink-tertiary">
            Filter
          </label>
          <Select value={category} onValueChange={(v) => setCategory(v ?? "All")}>
            <SelectTrigger id="cs-category" className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {studies.length} case studies.
      </p>

      <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {shown.map((study, i) => (
          <li key={study.slug}>
            <Reveal delay={i * 80} className="h-full">
              <Card variant="glass" interactive className="group h-full rounded-3xl p-6">
                <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-surface-sunken">
                  {study.coverUrl && (
                    <Image
                      src={study.coverUrl}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 ease-(--ease-out-quint) group-hover:scale-105"
                    />
                  )}
                  {study.category && (
                    <span className="absolute top-4 left-4 rounded-full border border-line-strong bg-surface/80 px-3 py-1 text-[0.625rem] font-bold text-ink-secondary uppercase backdrop-blur-md">
                      {study.category}
                    </span>
                  )}
                </div>

                <h2 className="font-heading text-[1.75rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                  <Link
                    href={`/case-studies/${study.slug}`}
                    className="after:absolute after:inset-0"
                  >
                    {study.title}
                  </Link>
                </h2>
                {study.excerpt && (
                  <p className="mt-3 line-clamp-3 text-ink-tertiary">{study.excerpt}</p>
                )}
              </Card>
            </Reveal>
          </li>
        ))}
      </ul>
    </section>
  );
}
