import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Timer } from "lucide-react";

import { listPublishedPosts } from "@/lib/supabase/content-queries";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BlogIndex } from "./BlogIndex";
import { NewsletterPanel } from "./NewsletterPanel";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Weekly decodes of digital transformation and architectural excellence from the Nexus engineering team.",
};

export default async function BlogPage() {
  const posts = await listPublishedPosts();
  // The editor's pick, else the newest. Never a hardcoded slug.
  const post = posts.find((p) => p.isFeatured) ?? posts[0] ?? null;

  return (
    <>
      <div className="noise-field" aria-hidden />

      {post ? (
      /* ── Featured post ──────────────────────────────────────────────── */
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pt-12 pb-20 md:px-10">
        <span
          className="bloom -top-40 -right-40 size-150 bg-brand/10 blur-[120px]"
          aria-hidden
        />

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              {post.category && (
                <span className="rounded-full border border-line-strong bg-surface-sunken px-3 py-1 text-xs font-bold tracking-widest text-ink-secondary uppercase">
                  {post.category}
                </span>
              )}
              <span className="flex items-center gap-1 text-sm text-ink-tertiary">
                <Timer className="size-4" aria-hidden />
                {post.readMinutes ?? "—"} min read
              </span>
            </div>

            <h1 className="font-heading text-[2.5rem] leading-tight font-bold text-balance text-ink md:text-[3rem]">
              <Link href={`/blog/${post.slug}`} className="hover:text-brand">
                {post.title}
              </Link>
            </h1>

            <p className="max-w-xl text-lg leading-relaxed text-ink-secondary">
              {post.excerpt}
            </p>

            {post.authorName && (
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarFallback>{initials(post.authorName)}</AvatarFallback>
                </Avatar>
                <p className="font-medium text-ink">{post.authorName}</p>
              </div>
            )}

            <Link
              href={`/blog/${post.slug}`}
              className="group flex w-fit items-center gap-2 font-bold text-brand"
            >
              Read full insight
              <ArrowRight
                className="size-5 transition-transform duration-(--duration-normal) group-hover:translate-x-1"
                aria-hidden
              />
            </Link>
          </div>

          <Card
            variant="glass"
            className="border-beam relative aspect-4/3 overflow-hidden rounded-[2rem] shadow-e4"
          >
            {post.coverUrl && (
              <Image
                src={post.coverUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover opacity-70"
                priority
              />
            )}
            {/* The invented per-post metric chips ("Engagement 94.2%") were
                removed rather than migrated — they were figures attached to
                articles that nothing measured. */}
          </Card>
        </div>
      </section>
      ) : (
        <section className="mx-auto max-w-3xl px-4 py-24 text-center md:px-10">
          <h1 className="font-heading text-[2.5rem] leading-tight font-bold text-ink">
            Insights
          </h1>
          <p className="mt-4 text-lg text-ink-tertiary">
            Nothing published yet. New writing from the engineering team appears here.
          </p>
        </section>
      )}

      <BlogIndex posts={posts} />
      <NewsletterPanel />
    </>
  );
}
