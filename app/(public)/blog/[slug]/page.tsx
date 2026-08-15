import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import type { PageBlock } from "@/lib/supabase/page-actions";
import { getPost } from "@/lib/supabase/content-queries";
import { JsonLd, articleLd } from "@/components/seo/JsonLd";

type Props = { params: { slug: string } };

/**
 * A post is a published CMS page and nothing else.
 *
 * This route used to read lib/posts.ts and fall through to a scaffold for every
 * slug, because that module carried card metadata but no article body — so no
 * post on the site had ever actually been readable.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return { title: "Post not found" };

  const seo = post.seo as { title?: string; description?: string };
  return {
    title: seo.title || post.title,
    description: seo.description || post.excerpt || undefined,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <main>
      {/* Spec §15.3. Dates and author come from content_details, so a post
          without them emits an Article with those keys absent rather than
          with invented values. */}
      <JsonLd
        data={articleLd({
          headline: post.title,
          url: `/blog/${params.slug}`,
          excerpt: post.excerpt,
          coverUrl: post.coverUrl,
          publishedOn: post.publishedOn,
          authorName: post.authorName,
        })}
      />
      <BlockRenderer blocks={post.blocks as PageBlock[]} />
    </main>
  );
}
