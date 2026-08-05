"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Keyword tracking.
 *
 * A target list and its position history are agency-owned data, so they live
 * here. Impressions, clicks and CTR do not: those come from Search Console,
 * and this module deliberately has no place to put an invented one.
 */

export type KeywordRow = Database["public"]["Tables"]["seo_keywords"]["Row"];
export type KeywordIntent = Database["public"]["Enums"]["keyword_intent"];

export type TrackedKeyword = KeywordRow & {
  pages: { title: string; slug: string } | null;
  /** Null until a position has been recorded — not zero, which would rank first. */
  position: number | null;
  measuredOn: string | null;
  /** Positive means the ranking improved. Null when there is only one snapshot. */
  movement: number | null;
};

export async function listKeywords(): Promise<TrackedKeyword[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("seo_keywords")
    .select("*, pages ( title, slug )")
    .order("term");

  const rows = (data ?? []) as unknown as Array<
    KeywordRow & { pages: { title: string; slug: string } | null }
  >;
  if (rows.length === 0) return [];

  // A view, so it cannot be embedded.
  const { data: positions } = await supabase
    .from("keyword_positions")
    .select("keyword_id, current_position, measured_on, movement")
    .in("keyword_id", rows.map((r) => r.id));

  const byId = new Map(
    (positions ?? []).map((p) => [
      p.keyword_id as string,
      {
        position: p.current_position === null ? null : Number(p.current_position),
        measuredOn: (p.measured_on as string) ?? null,
        movement: p.movement === null ? null : Number(p.movement),
      },
    ])
  );

  return rows.map((r) => ({
    ...r,
    ...(byId.get(r.id) ?? { position: null, measuredOn: null, movement: null }),
  }));
}

/* ------------------------------------------------------------ mutations -- */

type Result = { ok: true } | { error: string };

export async function createKeyword(form: FormData): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();

  const term = String(form.get("term") ?? "").trim();
  if (term.length < 2) return { error: "Enter a keyword to track." };

  const volume = form.get("searchVolume");
  const difficulty = form.get("difficulty");

  const { error } = await supabase.from("seo_keywords").insert({
    term,
    intent: String(form.get("intent") ?? "informational") as KeywordIntent,
    // Empty stays null. Writing 0 would claim the term has been researched and
    // has no search volume, which is a different and much stronger statement.
    search_volume: volume === null || String(volume).trim() === "" ? null : Number(volume),
    difficulty: difficulty === null || String(difficulty).trim() === "" ? null : Number(difficulty),
    target_url: String(form.get("targetUrl") ?? "").trim() || null,
    page_id: String(form.get("pageId") ?? "").trim() || null,
    notes: String(form.get("notes") ?? "").trim() || null,
    created_by: auth.user?.id ?? null,
  });

  if (error) {
    return {
      error: error.code === "23505" ? "That keyword is already being tracked." : error.message,
    };
  }

  revalidatePath("/admin/analytics/keywords");
  revalidatePath("/admin/analytics/seo");
  return { ok: true };
}

export async function updateKeyword(id: string, form: FormData): Promise<Result> {
  const supabase = await createClient();
  const volume = form.get("searchVolume");
  const difficulty = form.get("difficulty");

  const { error } = await supabase
    .from("seo_keywords")
    .update({
      term: String(form.get("term") ?? "").trim(),
      intent: String(form.get("intent") ?? "informational") as KeywordIntent,
      search_volume: volume === null || String(volume).trim() === "" ? null : Number(volume),
      difficulty:
        difficulty === null || String(difficulty).trim() === "" ? null : Number(difficulty),
      target_url: String(form.get("targetUrl") ?? "").trim() || null,
      page_id: String(form.get("pageId") ?? "").trim() || null,
      notes: String(form.get("notes") ?? "").trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/analytics/keywords");
  revalidatePath("/admin/analytics/seo");
  return { ok: true };
}

/**
 * Records where a keyword ranks today.
 *
 * Upserted on (keyword, date) so recording twice in one day corrects the
 * figure rather than creating a second snapshot that makes movement read as
 * zero.
 */
export async function recordPosition(keywordId: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const position = Number(form.get("position") ?? 0);
  if (!Number.isInteger(position) || position < 1 || position > 200) {
    return { error: "Position must be a whole number between 1 and 200." };
  }

  const { error } = await supabase.from("keyword_rankings").upsert(
    {
      keyword_id: keywordId,
      position,
      recorded_on: String(form.get("recordedOn") ?? "").trim() || new Date().toISOString().slice(0, 10),
      source: String(form.get("source") ?? "manual").trim() || "manual",
    },
    { onConflict: "keyword_id,recorded_on" }
  );

  if (error) return { error: error.message };
  revalidatePath("/admin/analytics/keywords");
  revalidatePath("/admin/analytics/seo");
  return { ok: true };
}

export async function deleteKeyword(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("seo_keywords").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/analytics/keywords");
  revalidatePath("/admin/analytics/seo");
  return { ok: true };
}

/* ------------------------------------------------------ content coverage -- */

export type SeoCoverage = {
  totalPages: number;
  published: number;
  missingTitle: number;
  missingDescription: number;
  keywordsWithoutTarget: number;
};

/**
 * SEO health that can actually be computed — the metadata completeness of the
 * pages this CMS owns. No impressions, no CTR, no "domain authority": nothing
 * that requires a third party this app is not connected to.
 */
export async function getSeoCoverage(): Promise<SeoCoverage> {
  noStore();
  const supabase = await createClient();

  // SEO lives on the version, not the page — publishing is one atomic row
  // write, so a page's metadata is whatever its live version carries. The
  // published version is the one that matters here; a draft's title is not
  // what a search engine sees.
  const [pagesRes, versionsRes, keywordsRes] = await Promise.all([
    supabase.from("pages").select("id, status"),
    supabase.from("page_versions").select("page_id, seo, is_draft").eq("is_draft", false),
    supabase.from("seo_keywords").select("id, page_id, target_url"),
  ]);

  const pages = (pagesRes.data ?? []) as Array<{ id: string; status: string }>;
  const seoByPage = new Map(
    ((versionsRes.data ?? []) as Array<{ page_id: string; seo: Record<string, unknown> | null }>).map(
      (v) => [v.page_id, v.seo]
    )
  );

  const missing = (p: { id: string }, key: string) => {
    const value = seoByPage.get(p.id)?.[key];
    return typeof value !== "string" || value.trim().length === 0;
  };

  return {
    totalPages: pages.length,
    published: pages.filter((p) => p.status === "published").length,
    missingTitle: pages.filter((p) => missing(p, "title")).length,
    missingDescription: pages.filter((p) => missing(p, "description")).length,
    keywordsWithoutTarget: (keywordsRes.data ?? []).filter(
      (k) => !k.page_id && !k.target_url
    ).length,
  };
}
