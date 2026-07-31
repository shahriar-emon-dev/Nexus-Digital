import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Timer } from "lucide-react";

import { cn } from "@/lib/utils";
import { authorFor, categoryTone, featuredPost } from "@/lib/posts";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { BlogIndex } from "./BlogIndex";
import { NewsletterPanel } from "./NewsletterPanel";

export const metadata: Metadata = {
  title: "Insights",
  description:
    "Weekly decodes of digital transformation and architectural excellence from the Nexus engineering team.",
};

export default function BlogPage() {
  const post = featuredPost;
  const author = authorFor(post);

  return (
    <>
      <div className="noise-field" aria-hidden />

      {/* ── Featured post ──────────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-7xl overflow-hidden px-4 pt-12 pb-20 md:px-10">
        <span
          className="bloom -top-40 -right-40 size-150 bg-brand/10 blur-[120px]"
          aria-hidden
        />

        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold tracking-widest uppercase",
                  categoryTone[post.category]
                )}
              >
                {post.category}
              </span>
              <span className="flex items-center gap-1 text-sm text-ink-tertiary">
                <Timer className="size-4" aria-hidden />
                {post.readMinutes} min read
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

            {author && (
              <div className="flex items-center gap-4">
                <Avatar size="lg">
                  <AvatarImage src={author.portrait} alt="" />
                  <AvatarFallback>{initials(author.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-ink">{author.name}</p>
                  <p className="text-sm text-ink-tertiary">{author.role}</p>
                </div>
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
            <Image
              src={post.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover opacity-70"
              priority
            />
            {post.metrics && (
              <dl className="absolute right-6 bottom-6 left-6 flex gap-4">
                {post.metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="flex-1 rounded-2xl border border-line bg-graphite-1000/50 p-4 backdrop-blur-xl"
                  >
                    <dt className="text-[0.625rem] tracking-tight text-graphite-300 uppercase">
                      {metric.label}
                    </dt>
                    <dd
                      data-tabular
                      className={cn(
                        "text-lg font-bold",
                        metric.tone === "brand" ? "text-brand" : "text-ion"
                      )}
                    >
                      {metric.value}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </Card>
        </div>
      </section>

      <BlogIndex />
      <NewsletterPanel />
    </>
  );
}
