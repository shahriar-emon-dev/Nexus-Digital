"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ChevronDown, MoveRight, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import type { ContentCard } from "@/lib/supabase/content-queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal } from "@/components/marketing/Reveal";

const PAGE_SIZE = 3;

const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const formatDate = (iso: string) => dateFormat.format(new Date(iso));

/**
 * Posts come from the CMS. This component used to read `lib/posts.ts`, so
 * publishing from the admin changed nothing a visitor could see.
 *
 * Categories are derived from the rows rather than a fixed union, so a filter
 * can never offer one that matches nothing.
 */
export function BlogIndex({ posts }: { posts: ContentCard[] }) {
  const [category, setCategory] = React.useState<string>("All");
  const [shown, setShown] = React.useState(PAGE_SIZE);

  const categories = React.useMemo(
    () => [...new Set(posts.map((p) => p.category).filter((c): c is string => Boolean(c)))],
    [posts]
  );

  const filtered = React.useMemo(
    () => (category === "All" ? posts : posts.filter((p) => p.category === category)),
    [posts, category]
  );
  const visible = filtered.slice(0, shown);

  return (
    <>
      <section className="mx-auto max-w-7xl px-4 py-8 md:px-10">
        <div
          role="group"
          aria-label="Filter by category"
          className="flex flex-wrap items-center gap-4 border-b border-line-subtle pb-8"
        >
          {["All", ...categories].map((c) => {
            const selected = category === c;
            return (
              <button
                key={c}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setCategory(c);
                  setShown(PAGE_SIZE);
                }}
                className={cn(
                  "rounded-full px-6 py-2 text-[0.8125rem] font-semibold transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "bg-brand text-brand-fg"
                    : "text-ink-tertiary hover:bg-surface-sunken hover:text-ink"
                )}
              >
                {c}
              </button>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 md:px-10">
        <ul className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((post, i) => (
            <li key={post.slug}>
              <Reveal delay={i * 80} className="h-full">
                <Card
                  variant="glass"
                  interactive
                  className={cn(
                    "group h-full rounded-3xl p-6",
                    post.isFeatured && "border-beam"
                  )}
                >
                  {/* The cover is optional: a post without one gets the tinted
                      panel rather than a broken image. The covers this replaced
                      were design-tool CDN URLs that will expire. */}
                  <div className="relative mb-6 aspect-video overflow-hidden rounded-2xl bg-surface-sunken">
                    {post.coverUrl && (
                      <Image
                        src={post.coverUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover transition-transform duration-500 ease-(--ease-out-quint) group-hover:scale-105"
                      />
                    )}
                    {post.category && (
                      <span className="absolute top-4 left-4 rounded-full border border-line-strong bg-surface/80 px-3 py-1 text-[0.625rem] font-bold text-ink-secondary uppercase backdrop-blur-md">
                        {post.category}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-4">
                    <div className="flex items-center justify-between text-xs text-ink-tertiary">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="size-3.5" aria-hidden />
                        {post.publishedOn && (
                          <time dateTime={post.publishedOn}>{formatDate(post.publishedOn)}</time>
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <Timer className="size-3.5" aria-hidden />
                        {post.readMinutes ?? "—"} min
                      </span>
                    </div>

                    <h2 className="font-heading text-[1.75rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                      <Link href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
                        {post.title}
                      </Link>
                    </h2>
                    <p className="line-clamp-3 text-ink-tertiary">{post.excerpt}</p>
                  </div>

                  <div className="mt-8 flex items-center justify-between border-t border-line-subtle pt-6">
                    <span className="text-xs font-bold tracking-widest text-brand uppercase">
                      Read more
                    </span>
                    <MoveRight
                      className="size-5 text-brand transition-transform duration-(--duration-normal) group-hover:translate-x-1"
                      aria-hidden
                    />
                  </div>
                </Card>
              </Reveal>
            </li>
          ))}
        </ul>

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-ink-tertiary">
            No insights in that category yet.
          </p>
        )}

        <div className="mt-20 flex flex-col items-center gap-6">
          {shown < filtered.length && (
            <Button
              variant="outline"
              size="xl"
              className="rounded-full px-12"
              onClick={() => setShown((s) => s + PAGE_SIZE)}
            >
              Load More Insights
              <ChevronDown />
            </Button>
          )}
          {/* The source hardcoded "Showing 4 of 42" regardless of what was on
              screen. This counts what is actually rendered. */}
          <p aria-live="polite" className="text-sm text-ink-tertiary">
            Showing {visible.length} of {filtered.length}{" "}
            {filtered.length === 1 ? "article" : "articles"}
          </p>
        </div>
      </section>
    </>
  );
}
