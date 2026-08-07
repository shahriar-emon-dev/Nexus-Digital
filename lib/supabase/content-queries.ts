import { createClient } from "./server";

/**
 * Editorial content — blog posts and case studies — read from the CMS.
 *
 * Both used to be static TypeScript modules, so publishing from the admin
 * changed nothing a visitor could see and the two detail routes fell through to
 * a scaffold.
 *
 * Publication is decided by `published_version_id`, not by `status` alone, for
 * the same reason it is on services: an editor can set a page back to draft
 * while a published version still exists, and the visitor should stop seeing it
 * either way.
 */

export type ContentCard = {
  slug: string;
  title: string;
  excerpt: string | null;
  category: string | null;
  coverUrl: string | null;
  readMinutes: number | null;
  publishedOn: string | null;
  isFeatured: boolean;
  authorName: string | null;
};

async function listByType(pageType: string, prefix: string): Promise<ContentCard[]> {
  const supabase = await createClient();

  const { data: pages } = await supabase
    .from("pages")
    .select("id, title, slug, published_version_id")
    .eq("page_type", pageType)
    .eq("status", "published");

  const rows = (pages ?? []).filter((p) => p.published_version_id);
  if (rows.length === 0) return [];

  // Second query rather than an embed: content_details is keyed by page_id and
  // PostgREST needs the FK metadata to join it inline.
  const { data: details } = await supabase
    .from("content_details")
    .select("page_id, excerpt, category, cover_url, read_minutes, published_on, is_featured, author:profiles ( full_name, email )")
    .in("page_id", rows.map((p) => p.id));

  const byPage = new Map(
    ((details ?? []) as unknown as {
      page_id: string;
      excerpt: string | null;
      category: string | null;
      cover_url: string | null;
      read_minutes: number | null;
      published_on: string | null;
      is_featured: boolean;
      author: { full_name: string | null; email: string } | null;
    }[]).map((d) => [d.page_id, d])
  );

  return rows
    .map((p) => {
      const d = byPage.get(p.id);
      return {
        slug: (p.slug as string).replace(new RegExp(`^${prefix}/`), ""),
        title: p.title as string,
        excerpt: d?.excerpt ?? null,
        category: d?.category ?? null,
        coverUrl: d?.cover_url ?? null,
        readMinutes: d?.read_minutes ?? null,
        publishedOn: d?.published_on ?? null,
        isFeatured: d?.is_featured ?? false,
        authorName: d?.author?.full_name || d?.author?.email || null,
      };
    })
    // Newest first, with undated entries last rather than sorted as epoch.
    .sort((a, b) => (b.publishedOn ?? "").localeCompare(a.publishedOn ?? ""));
}

export const listPublishedPosts = () => listByType("post", "blog");
export const listPublishedCaseStudies = () => listByType("case_study", "case-studies");

export type ContentPage = ContentCard & {
  blocks: unknown[];
  seo: Record<string, unknown>;
};

async function getByslug(
  pageType: string,
  prefix: string,
  slug: string
): Promise<ContentPage | null> {
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, title, slug, published_version_id")
    .eq("slug", `${prefix}/${slug}`)
    .eq("page_type", pageType)
    .eq("status", "published")
    .maybeSingle();
  if (!page?.published_version_id) return null;

  const [{ data: version }, { data: detail }] = await Promise.all([
    supabase
      .from("page_versions")
      .select("blocks, seo")
      .eq("id", page.published_version_id)
      .maybeSingle(),
    supabase
      .from("content_details")
      .select("excerpt, category, cover_url, read_minutes, published_on, is_featured, author:profiles ( full_name, email )")
      .eq("page_id", page.id)
      .maybeSingle(),
  ]);
  if (!version) return null;

  const d = detail as unknown as {
    excerpt: string | null;
    category: string | null;
    cover_url: string | null;
    read_minutes: number | null;
    published_on: string | null;
    is_featured: boolean;
    author: { full_name: string | null; email: string } | null;
  } | null;

  return {
    slug,
    title: page.title as string,
    excerpt: d?.excerpt ?? null,
    category: d?.category ?? null,
    coverUrl: d?.cover_url ?? null,
    readMinutes: d?.read_minutes ?? null,
    publishedOn: d?.published_on ?? null,
    isFeatured: d?.is_featured ?? false,
    authorName: d?.author?.full_name || d?.author?.email || null,
    blocks: (version.blocks as unknown[]) ?? [],
    seo: (version.seo as Record<string, unknown>) ?? {},
  };
}

export const getPost = (slug: string) => getByslug("post", "blog", slug);
export const getCaseStudy = (slug: string) => getByslug("case_study", "case-studies", slug);
