"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Editorial metadata for a blog post or case study.
 *
 * `content_details` was readable and nothing else — no INSERT or UPDATE path
 * existed anywhere in the application, so excerpt, category, cover image, read
 * time, publish date and author could only ever be set by writing a migration.
 * The consequence is visible in production right now: `blog/shipping-on-the-edge`
 * is a published post with no `content_details` row at all, so it renders with
 * no excerpt, no category and no date, and sorts last because its publish date
 * is null. Nobody could fix it from the admin.
 *
 * Kept out of `page-actions.ts` deliberately. That module owns the page itself —
 * blocks, versions, publishing — and this owns a sidecar row keyed by page_id.
 * Merging them would mean an autosave of the block structure could also
 * overwrite editorial fields the author was not editing.
 */

export type ContentDetailsRow = Database["public"]["Tables"]["content_details"]["Row"];

type Result = { ok: true } | { error: string };

export type ContentDetails = {
  excerpt: string | null;
  category: string | null;
  coverUrl: string | null;
  readMinutes: number | null;
  publishedOn: string | null;
  isFeatured: boolean;
  authorId: string | null;
};

export async function getContentDetails(pageId: string): Promise<ContentDetails | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_details")
    .select("excerpt, category, cover_url, read_minutes, published_on, is_featured, author_id")
    .eq("page_id", pageId)
    .maybeSingle();

  // Null means "no row yet", which the pane renders as an empty form rather
  // than as an error — a post created before this feature existed is normal.
  if (!data) return null;

  return {
    excerpt: data.excerpt,
    category: data.category,
    coverUrl: data.cover_url,
    readMinutes: data.read_minutes,
    publishedOn: data.published_on,
    isFeatured: data.is_featured,
    authorId: data.author_id,
  };
}

/**
 * Creates the row if it is missing, updates it otherwise.
 *
 * Upsert rather than update: most posts in this database have no
 * `content_details` row, so an update-only path would silently do nothing on
 * exactly the pages that need fixing most.
 */
export async function saveContentDetails(pageId: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const excerpt = String(form.get("excerpt") ?? "").trim();
  const category = String(form.get("category") ?? "").trim();
  const coverUrl = String(form.get("coverUrl") ?? "").trim();
  const publishedOn = String(form.get("publishedOn") ?? "").trim();
  const rawRead = String(form.get("readMinutes") ?? "").trim();

  if (excerpt.length > 400) {
    return { error: "Keep the excerpt under 400 characters — it is a card summary." };
  }
  if (coverUrl && !/^https?:\/\//i.test(coverUrl)) {
    return { error: "The cover image must be a full http(s) URL." };
  }
  if (publishedOn && Number.isNaN(new Date(publishedOn).getTime())) {
    return { error: "That publish date is not a valid date." };
  }

  // Empty stays null: "not measured" is a real state, and 0 minutes would
  // render as "0 min read" on every card.
  const readMinutes = rawRead === "" ? null : Number(rawRead);
  if (readMinutes !== null && (!Number.isFinite(readMinutes) || readMinutes < 0 || readMinutes > 600)) {
    return { error: "Read time must be between 0 and 600 minutes." };
  }

  const authorId = String(form.get("authorId") ?? "").trim() || null;

  const { error } = await supabase.from("content_details").upsert(
    {
      page_id: pageId,
      excerpt: excerpt || null,
      category: category || null,
      cover_url: coverUrl || null,
      published_on: publishedOn || null,
      read_minutes: readMinutes,
      is_featured: form.get("isFeatured") === "on" || form.get("isFeatured") === "true",
      author_id: authorId,
    },
    { onConflict: "page_id" }
  );

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You do not have permission to edit this content."
        : error.message,
    };
  }

  // The index pages sort and filter on these, so both the list and the post
  // itself are stale.
  revalidatePath("/blog");
  revalidatePath("/case-studies");
  revalidatePath("/admin/content/blog");
  revalidatePath("/admin/content/case-studies");
  return { ok: true };
}

/** Authors an editor can credit — staff who are visible on the public site. */
export async function listAuthorOptions(): Promise<{ id: string; name: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("is_active", true)
    .order("full_name");

  return ((data ?? []) as { id: string; full_name: string | null; email: string }[]).map((p) => ({
    id: p.id,
    name: p.full_name || p.email,
  }));
}
