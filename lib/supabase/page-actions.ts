"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type { Json } from "./types";

/**
 * Page CMS server actions.
 *
 * A page is identity plus a pointer; its content lives in versions. Editing
 * always writes the single draft row, never a published one, so the public site
 * cannot change until publish_page() freezes a copy and moves the pointer.
 */

export type BlockKind =
  | "hero"
  | "featureGrid"
  | "pricing"
  | "faq"
  | "richText"
  | "testimonials"
  | "cta";

export type PageBlock = {
  id: string;
  kind: BlockKind;
  variant: string;
  visible: boolean;
  /** What the block actually says. The field 0012 added. */
  data: Record<string, unknown>;
};

export type PageStatus = "draft" | "published" | "scheduled" | "unpublished" | "archived";

export type PageRecord = {
  id: string;
  slug: string;
  title: string;
  internal_name: string;
  page_type: string;
  status: PageStatus;
  published_version_id: string | null;
  nav_in_main: boolean;
  nav_label: string | null;
  updated_at: string;
  published_at: string | null;
};

export type PageDraft = {
  page: PageRecord;
  versionId: string;
  blocks: PageBlock[];
  seo: Record<string, unknown>;
  updatedAt: string;
  /** Frozen versions, newest first — the revision history. */
  history: { id: string; version_number: number; created_at: string }[];
};

export type PageResult = { error: string } | { ok: true; id?: string };

const rlsMessage = (m: string, verb: string) =>
  m.includes("row-level security") || m.includes("violates")
    ? `You do not have permission to ${verb} pages.`
    : m;

export async function listPages(): Promise<PageRecord[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("*")
    .order("updated_at", { ascending: false });
  return (data ?? []) as PageRecord[];
}

/** Page plus its draft. Creates the draft if the page somehow has none. */
export async function getPageDraft(id: string): Promise<PageDraft | null> {
  const supabase = await createClient();

  const { data: page } = await supabase.from("pages").select("*").eq("id", id).maybeSingle();
  if (!page) return null;

  const { data: versions } = await supabase
    .from("page_versions")
    .select("id, version_number, blocks, seo, is_draft, created_at, updated_at")
    .eq("page_id", id)
    .order("version_number", { ascending: false });

  const all = versions ?? [];
  let draft = all.find((v) => v.is_draft);

  if (!draft) {
    const next = Math.max(0, ...all.map((v) => v.version_number)) + 1;
    const { data: created } = await supabase
      .from("page_versions")
      .insert({ page_id: id, version_number: next, blocks: [], seo: {}, is_draft: true })
      .select("id, version_number, blocks, seo, is_draft, created_at, updated_at")
      .single();
    draft = created ?? undefined;
  }
  if (!draft) return null;

  return {
    page: page as PageRecord,
    versionId: draft.id as string,
    blocks: (draft.blocks as PageBlock[]) ?? [],
    seo: (draft.seo as Record<string, unknown>) ?? {},
    updatedAt: (draft.updated_at ?? draft.created_at) as string,
    history: all
      .filter((v) => !v.is_draft)
      .map((v) => ({
        id: v.id as string,
        version_number: v.version_number as number,
        created_at: v.created_at as string,
      })),
  };
}

export type PageTemplate = {
  id: string;
  name: string;
  description: string;
  category: string;
  blocks: PageBlock[];
};

export async function listTemplates(): Promise<PageTemplate[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("page_templates")
    .select("id, name, description, category, blocks")
    .order("display_order");
  return (data ?? []) as unknown as PageTemplate[];
}

export async function createPage(formData: FormData): Promise<PageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "");

  if (!title) return { error: "Give the page a title." };
  if (!/^[a-z0-9]+(?:[-/][a-z0-9]+)*$/.test(slug)) {
    return { error: "Slug may use lowercase letters, numbers, hyphens and slashes only." };
  }

  const { data: page, error } = await supabase
    .from("pages")
    .insert({
      slug,
      title,
      internal_name: String(formData.get("internalName") ?? "").trim() || title,
      page_type: String(formData.get("pageType") ?? "standard"),
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.message.includes("pages_slug_key")) return { error: "That URL is already taken." };
    if (error.message.includes("pages_slug_reserved"))
      return { error: "That URL is reserved by the application." };
    if (error.message.includes("pages_slug_shape")) return { error: "That URL is not a valid slug." };
    return { error: rlsMessage(error.message, "create") };
  }

  // Instantiate the chosen template. Its blocks are COPIED, and every block id
  // is regenerated so two pages built from one template never collide.
  const templateId = String(formData.get("templateId") ?? "blank");
  const { data: template } = await supabase
    .from("page_templates")
    .select("blocks")
    .eq("id", templateId)
    .maybeSingle();

  const seed: PageBlock[] = ((template?.blocks as unknown as PageBlock[]) ?? []).map((b) => ({
    ...b,
    id: crypto.randomUUID(),
  }));

  // A page needs an entry point even if the template row was missing.
  const blocks: PageBlock[] = seed.length
    ? seed
    : [
        {
          id: crypto.randomUUID(),
          kind: "hero",
          variant: "Default",
          visible: true,
          data: { heading: title, body: "" },
        },
      ];

  // The first block carries the page title, so the hero is not left saying
  // "Introducing your product" on a page called something else.
  if (blocks[0]?.kind === "hero") {
    blocks[0] = { ...blocks[0], data: { ...blocks[0].data, heading: title } };
  }

  const { error: versionError } = await supabase.from("page_versions").insert({
    page_id: page.id,
    version_number: 1,
    is_draft: true,
    created_by: user.id,
    blocks: blocks as unknown as Json,
  });

  if (versionError) {
    // Without a draft the page is unopenable, so do not leave a half-created
    // record behind pretending to be a page.
    await supabase.from("pages").delete().eq("id", page.id);
    return { error: versionError.message };
  }

  revalidatePath("/admin/content/pages");
  return { ok: true, id: page.id as string };
}

/** Writes the draft. Never touches a published version. */
export async function saveDraft(
  versionId: string,
  blocks: PageBlock[],
  seo?: Record<string, unknown>
): Promise<PageResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("page_versions")
    // Cast at the boundary: the block tree is structurally JSON, but its
    // TypeScript shape is deliberately richer than the generated Json type.
    .update({ blocks: blocks as unknown as Json, ...(seo ? { seo: seo as Json } : {}) })
    .eq("id", versionId)
    .eq("is_draft", true);

  if (error) return { error: rlsMessage(error.message, "edit") };
  return { ok: true };
}

export async function publishPage(pageId: string, slug: string): Promise<PageResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("publish_page", { p_page_id: pageId });
  if (error) return { error: rlsMessage(error.message, "publish") };

  // The public route is statically rendered and revalidated on publish, so the
  // performance work survives a dynamic CMS.
  revalidatePath(`/${slug}`);
  revalidatePath("/admin/content/pages");
  return { ok: true };
}

export async function unpublishPage(pageId: string, slug: string): Promise<PageResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("unpublish_page", { p_page_id: pageId });
  if (error) return { error: rlsMessage(error.message, "unpublish") };

  revalidatePath(`/${slug}`);
  revalidatePath("/admin/content/pages");
  return { ok: true };
}

/**
 * Restores an older version by copying it into the draft.
 *
 * History is never rewritten: the old version stays frozen, and the restored
 * content becomes a draft the editor still has to publish.
 */
export async function restoreVersion(
  versionId: string,
  draftVersionId: string
): Promise<PageResult> {
  const supabase = await createClient();

  const { data: source } = await supabase
    .from("page_versions")
    .select("blocks, seo")
    .eq("id", versionId)
    .maybeSingle();
  if (!source) return { error: "That version no longer exists." };

  const { error } = await supabase
    .from("page_versions")
    .update({ blocks: source.blocks as Json, seo: source.seo as Json })
    .eq("id", draftVersionId)
    .eq("is_draft", true);

  if (error) return { error: rlsMessage(error.message, "edit") };
  return { ok: true };
}

/* -------------------------------------------------- public rendering ---- */

/** The published block tree for a slug, or null. RLS hides everything else. */
export async function getPublishedPage(
  slug: string
): Promise<{ title: string; blocks: PageBlock[]; seo: Record<string, unknown> } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("pages")
    .select("title, published_version_id")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!data?.published_version_id) return null;

  const { data: version } = await supabase
    .from("page_versions")
    .select("blocks, seo")
    .eq("id", data.published_version_id)
    .maybeSingle();
  if (!version) return null;

  return {
    title: data.title as string,
    blocks: (version.blocks as PageBlock[]) ?? [],
    seo: (version.seo as Record<string, unknown>) ?? {},
  };
}

export async function listPublishedSlugs(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("pages").select("slug").eq("status", "published");
  return (data ?? []).map((p) => p.slug as string);
}
