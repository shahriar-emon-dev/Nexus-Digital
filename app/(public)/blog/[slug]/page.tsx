import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPage } from "@/lib/supabase/page-actions";

import { RouteScaffold } from "@/components/shared/RouteScaffold";

import { authorFor, categoryTone, formatDate, posts } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { ArticleToc } from "@/components/blog/ArticleToc";
import { PostBody } from "@/components/blog/PostBody";
import { ReadingProgress } from "@/components/blog/ReadingProgress";
import { ShareLinks } from "@/components/blog/ShareLinks";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return posts.filter((p) => p.body).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const cms = await getPublishedPage(`blog/${params.slug}`);
  if (cms) {
    const seo = cms.seo as { title?: string; description?: string };
    return { title: seo.title || cms.title, description: seo.description };
  }

  const post = posts.find((p) => p.slug === params.slug);
  if (!post) return { title: "Insight" };
  return { title: post.title, description: post.excerpt };
}

export default async function PostPage({ params }: Props) {
  // A CMS post wins. Checking first lets an editor publish without a
  // developer, and lets an existing post be taken over by publishing at the
  // same slug — while every link already in the index keeps working.
  const cms = await getPublishedPage(`blog/${params.slug}`);
  if (cms) {
    return (
      <main>
        <BlockRenderer blocks={cms.blocks} />
      </main>
    );
  }

  const post = posts.find((p) => p.slug === params.slug);

  // An unknown slug is genuinely not found. A real post whose body is not
  // written yet is a different case — it is linked from the index, so it keeps
  // the scaffold and answers 200. Conflating the two 404s live content.
  if (!post) notFound();
  if (!post.body) {
    return <RouteScaffold title={post.title} route={`/blog/${post.slug}`} />;
  }

  const author = authorFor(post);
  const toc = post.body
    .filter((b) => b.kind === "section")
    .map((b) => ({ id: b.id, heading: b.heading }));
  const next = posts.find((p) => p.id !== post.id && p.category !== post.category);

  // Split the title so the trailing phrase can carry the gradient.
  const accent = post.titleAccent;
  const lead = accent ? post.title.replace(accent, "").trim() : post.title;

  return (
    <>
      <ReadingProgress />
      <div className="noise-field" aria-hidden />

      <article className="relative mx-auto max-w-7xl px-4 pt-12 pb-32 md:px-10 md:pt-20">
        <span
          className="bloom -top-24 -left-24 size-125 bg-brand/10 blur-[120px]"
          aria-hidden
        />
        <span
          className="bloom top-1/2 -right-24 size-100 bg-ion/5 blur-[100px]"
          aria-hidden
        />

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <header className="relative mx-auto mb-16 flex max-w-200 flex-col gap-6">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold tracking-widest uppercase",
                categoryTone[post.category]
              )}
            >
              {post.category}
            </span>
            <span className="text-[0.8125rem] text-ink-tertiary">
              {post.readMinutes} min read
            </span>
          </div>

          <h1 className="font-heading text-[2.5rem] leading-tight font-bold text-balance text-ink md:text-[4rem]">
            {lead}{" "}
            {accent && (
              <span className="bg-gradient-to-r from-brand to-ion bg-clip-text text-transparent">
                {accent}
              </span>
            )}
          </h1>

          <p className="max-w-162 text-lg leading-relaxed text-ink-secondary">{post.excerpt}</p>

          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
            {author && (
              <>
                <Avatar size="lg">
                  <AvatarImage src={author.portrait} alt="" />
                  <AvatarFallback>{initials(author.name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-ink">{author.name}</p>
                  <p className="text-sm text-ink-tertiary">{author.role}</p>
                </div>
              </>
            )}
            <p className="text-sm text-ink-tertiary md:ml-auto">
              Published{" "}
              <time dateTime={post.publishedAt}>{formatDate(post.publishedAt)}</time>
            </p>
          </div>
        </header>

        {/* ── Featured image ───────────────────────────────────────────── */}
        <Card
          variant="glass"
          className="relative mb-20 aspect-21/9 w-full overflow-hidden rounded-3xl"
        >
          <Image
            src={post.image}
            alt=""
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        </Card>

        {/* ── Body + sidebar ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-[1fr_280px]">
          <div className="mx-auto lg:mx-0">
            <PostBody blocks={post.body} />
          </div>

          <aside className="hidden lg:block">
            <div className="sticky top-32 flex flex-col gap-12">
              <ArticleToc items={toc} />
              <ShareLinks title={post.title} />

              {next && (
                <div className="border-t border-line pt-8">
                  <h2 className="mb-6 text-xs font-semibold tracking-[0.2em] text-ink-tertiary uppercase">
                    Read Next
                  </h2>
                  <Link href={`/blog/${next.slug}`} className="group block">
                    <p className="leading-snug font-bold text-ink transition-colors group-hover:text-brand">
                      {next.title}
                    </p>
                    <p className="mt-2 text-xs text-ink-tertiary">
                      {next.readMinutes} min read • {next.category}
                    </p>
                  </Link>
                </div>
              )}
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
