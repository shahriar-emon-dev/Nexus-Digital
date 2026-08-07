"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { PageBlock } from "./page-actions";
import type { Database } from "./types";

/**
 * The service catalogue — one module, one source of truth.
 *
 * There were two independent service systems: a hardcoded catalogue with its
 * own editor, and the page-engine-backed list. A service is a page; this adds
 * only the catalogue fields a page does not have, and the page still owns the
 * content, the slug and the publish state.
 */

export type ServiceDetail = Database["public"]["Tables"]["service_details"]["Row"];
export type PageRow = Database["public"]["Tables"]["pages"]["Row"];

export type CatalogueService = ServiceDetail & {
  page: Pick<PageRow, "id" | "title" | "slug" | "status" | "updated_at"> | null;
  /** Projects sold against this service. Zero until any are linked. */
  projectCount: number;
};

export async function listServices(): Promise<CatalogueService[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("service_details")
    .select("*, page:pages ( id, title, slug, status, updated_at )")
    .order("display_order")
    .order("category");

  const rows = (data ?? []) as unknown as CatalogueService[];

  // The catalogue can drift behind the page list if a service page was created
  // outside this screen, so anything missing an entry is backfilled on read
  // rather than silently omitted.
  const { data: orphans } = await supabase
    .from("pages")
    .select("id, title, slug, status, updated_at")
    .eq("page_type", "service");

  const known = new Set(rows.map((r) => r.page_id));
  const missing = ((orphans ?? []) as PageRow[]).filter((p) => !known.has(p.id));

  if (missing.length > 0) {
    await supabase.from("service_details").insert(missing.map((p) => ({ page_id: p.id })));
    const { data: refreshed } = await supabase
      .from("service_details")
      .select("*, page:pages ( id, title, slug, status, updated_at )")
      .order("display_order")
      .order("category");
    return ((refreshed ?? []) as unknown as CatalogueService[]).map((r) => ({
      ...r,
      projectCount: 0,
    }));
  }

  return rows.map((r) => ({ ...r, projectCount: 0 }));
}

export type ServiceCategoryOption = string;

/** Categories in use, so the filter never offers one nothing belongs to. */
export async function listServiceCategories(): Promise<ServiceCategoryOption[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("service_details").select("category");
  return [...new Set((data ?? []).map((r) => r.category as string))].sort();
}

/* ------------------------------------------------------- public reading -- */

export type PublicService = {
  title: string;
  slug: string;
  blocks: PageBlock[];
  seo: Record<string, unknown>;
  category: string | null;
  priceFrom: number | null;
  leadTimeWeeks: number | null;
  summary: string | null;
};

/**
 * A published service for the public detail route.
 *
 * Returns null for a draft, an archived service, or a slug nobody has created —
 * the route 404s on all three. Publishing is decided by `published_version_id`,
 * not by `status`: an editor can set a page back to draft while a published
 * version still exists, and the visitor should stop seeing it either way.
 *
 * Deliberately does NOT read service_delivery_history. Which clients bought a
 * service is confidential, and that view runs with invoker rights specifically
 * so an anonymous caller gets nothing — reading it here would either return an
 * empty section on every visit or, if anyone ever relaxed the policy, publish
 * the client list.
 */
export async function getPublicService(slug: string): Promise<PublicService | null> {
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("pages")
    .select("id, title, slug, published_version_id")
    .eq("slug", `services/${slug}`)
    .eq("status", "published")
    .maybeSingle();
  if (!page?.published_version_id) return null;

  // Two queries, not an embed: PostgREST needs foreign-key metadata to join,
  // and it resolves the version by primary key here rather than by relationship.
  const [{ data: version }, { data: detail }] = await Promise.all([
    supabase
      .from("page_versions")
      .select("blocks, seo")
      .eq("id", page.published_version_id)
      .maybeSingle(),
    supabase
      .from("service_details")
      .select("category, price_from, lead_time_weeks, summary")
      .eq("page_id", page.id)
      .maybeSingle(),
  ]);
  if (!version) return null;

  return {
    title: page.title as string,
    slug,
    blocks: ((version.blocks ?? []) as unknown as PageBlock[]),
    seo: (version.seo as Record<string, unknown>) ?? {},
    category: detail?.category ?? null,
    priceFrom: detail?.price_from === null || detail?.price_from === undefined
      ? null
      : Number(detail.price_from),
    leadTimeWeeks: detail?.lead_time_weeks ?? null,
    summary: detail?.summary ?? null,
  };
}

/**
 * Published services, for the sitemap and any public listing.
 *
 * Filters on the publish pointer as well as the status, so a service that was
 * pulled back to draft leaves the sitemap on the next crawl instead of
 * advertising a URL that now 404s.
 */
export type PublishedService = {
  slug: string;
  title: string;
  category: string | null;
  updatedAt: string;
};

export async function listPublishedServices(): Promise<PublishedService[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("id, title, slug, updated_at, published_version_id")
    .eq("page_type", "service")
    .eq("status", "published");

  const pages = (data ?? []).filter((p) => p.published_version_id);
  if (pages.length === 0) return [];

  // Second query rather than an embed: PostgREST needs the FK metadata to join,
  // and service_details is keyed by page_id.
  const { data: details } = await supabase
    .from("service_details")
    .select("page_id, category")
    .in("page_id", pages.map((p) => p.id as string));

  const categoryOf = new Map(
    (details ?? []).map((d) => [d.page_id as string, d.category as string | null])
  );

  return pages
    .map((p) => ({
      slug: (p.slug as string).replace(/^services\//, ""),
      title: p.title as string,
      category: categoryOf.get(p.id as string) ?? null,
      updatedAt: p.updated_at as string,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/* ------------------------------------------------------------ mutations -- */

type Result = { ok: true } | { error: string };

export async function updateServiceDetails(pageId: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const price = form.get("priceFrom");
  const lead = form.get("leadTimeWeeks");

  const priceValue =
    price === null || String(price).trim() === "" ? null : Number(price);
  if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
    return { error: "Starting price cannot be negative." };
  }

  const leadValue = lead === null || String(lead).trim() === "" ? null : Number(lead);
  if (leadValue !== null && (!Number.isInteger(leadValue) || leadValue < 0 || leadValue > 260)) {
    return { error: "Lead time must be a whole number of weeks between 0 and 260." };
  }

  const { error } = await supabase
    .from("service_details")
    .update({
      category: String(form.get("category") ?? "").trim() || "Engineering",
      // Empty stays null: "not priced yet" and "free" are different claims.
      price_from: priceValue,
      currency: (String(form.get("currency") ?? "USD").trim() || "USD").slice(0, 3).toUpperCase(),
      lead_time_weeks: leadValue,
      summary: String(form.get("summary") ?? "").trim() || null,
      is_featured: form.get("isFeatured") === "on",
      display_order: Number(form.get("displayOrder") ?? 0) || 0,
    })
    .eq("page_id", pageId);

  if (error) return { error: error.message };

  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

export async function setServiceFeatured(pageId: string, featured: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("service_details")
    .update({ is_featured: featured })
    .eq("page_id", pageId);

  if (error) return { error: error.message };
  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}

/**
 * Reorders the catalogue.
 *
 * Positions are rewritten wholesale rather than swapped in pairs: swapping
 * leaves gaps and duplicates whenever two people reorder at once, and eight
 * rows are cheaper to rewrite than to reconcile.
 */
export async function reorderServices(pageIds: string[]): Promise<Result> {
  const supabase = await createClient();

  for (const [index, pageId] of pageIds.entries()) {
    const { error } = await supabase
      .from("service_details")
      .update({ display_order: index })
      .eq("page_id", pageId);
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/services");
  revalidatePath("/services");
  return { ok: true };
}
