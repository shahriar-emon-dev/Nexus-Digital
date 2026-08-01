import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { getPublishedPage } from "@/lib/supabase/page-actions";

/**
 * The universal page resolver.
 *
 * URL -> slug -> published page -> published version -> block renderer. This is
 * why a new page needs no developer: creating one in the admin and publishing
 * it makes this route resolve, with no file added anywhere.
 *
 * A required catch-all (not optional) so it never competes with `/` — and Next
 * gives typed routes such as /about and /services priority over it, so existing
 * pages are untouched.
 *
 * Unpublished pages are invisible here because RLS refuses them to the anon
 * key, not because this file filters them. A missing pointer is a 404.
 */

type Params = { params: { slug: string[] } };

export const revalidate = 60;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const page = await getPublishedPage(params.slug.join("/"));
  if (!page) return { title: "Not found" };

  const seo = page.seo as { title?: string; description?: string };
  return {
    title: seo.title || page.title,
    description: seo.description,
    alternates: { canonical: `/${params.slug.join("/")}` },
  };
}

export default async function DynamicCmsPage({ params }: Params) {
  const page = await getPublishedPage(params.slug.join("/"));
  if (!page) notFound();

  return (
    <main>
      {/* The page's own h1 comes from its hero block, so no heading is added
          here — two would break the document outline. */}
      <BlockRenderer blocks={page.blocks} />
    </main>
  );
}
