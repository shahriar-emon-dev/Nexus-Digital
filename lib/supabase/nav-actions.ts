"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";

/**
 * Navigation and site-structure server actions.
 *
 * A menu item that points at a page stores the page id. Its URL is resolved
 * when the menu renders, through the `resolved_menu_items` view, so renaming a
 * page cannot leave a stale link behind and an unpublished page cannot appear
 * in public navigation.
 */

export type MenuLocation = "header" | "footer" | "mobile" | "utility";
export type MenuItemType = "page" | "external" | "anchor";

export type Menu = { id: string; name: string; location: MenuLocation | null };

export type MenuItem = {
  id: string;
  menu_id: string;
  parent_id: string | null;
  label: string;
  item_type: MenuItemType;
  page_id: string | null;
  external_url: string | null;
  position: number;
  is_visible: boolean;
  open_in_new_tab: boolean;
};

export type ResolvedMenuItem = {
  id: string;
  parent_id: string | null;
  label: string;
  href: string;
  open_in_new_tab: boolean;
  badge: string | null;
  position: number;
};

export type NavResult = { error: string } | { ok: true; id?: string };

const msg = (m: string, verb: string) =>
  m.includes("row-level security")
    ? `You do not have permission to ${verb} navigation.`
    : m.includes("menus_location_key")
      ? "Another menu is already assigned to that location."
      : m.includes("one level of nesting")
        ? "Navigation supports one level of nesting."
        : m;

/* ------------------------------------------------------------- reading --- */

export async function listMenus(): Promise<Menu[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("menus").select("id, name, location").order("name");
  return (data ?? []) as Menu[];
}

export async function listMenuItems(menuId: string): Promise<MenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("menu_items")
    .select("*")
    .eq("menu_id", menuId)
    .order("position");
  return (data ?? []) as MenuItem[];
}

/**
 * The public menu for a location. Reads the view, so hidden items and items
 * whose target page is unpublished are already gone.
 */
export async function getPublicMenu(location: MenuLocation): Promise<ResolvedMenuItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resolved_menu_items")
    .select("id, parent_id, label, href, open_in_new_tab, badge, position")
    .eq("location", location)
    .order("position");
  return (data ?? []) as ResolvedMenuItem[];
}

export async function getSiteSettings(): Promise<{
  homepage_page_id: string | null;
  site_name: string;
  meta_description: string | null;
  og_image_url: string | null;
}> {
  const supabase = await createClient();
  // Reads the view, not the table. This is called from the public homepage with
  // the anon key, and site_settings itself became authenticated-only in 0060 so
  // that `updated_by` — a staff UUID — stops leaking. The view exposes the
  // presentational columns this needs and none of the identifying ones.
  //
  // meta_description and og_image_url joined the list when the homepage began
  // emitting Organization structured data. Both already appear as meta tags on
  // every public page, so surfacing them here reveals nothing new.
  const { data } = await supabase
    .from("public_site_settings")
    .select("homepage_page_id, site_name, meta_description, og_image_url")
    .maybeSingle();
  // A view loses NOT NULL, so site_name comes back nullable even though the
  // underlying column is not — coalesced rather than cast away.
  return {
    homepage_page_id: data?.homepage_page_id ?? null,
    site_name: data?.site_name ?? "Nexus",
    meta_description: data?.meta_description ?? null,
    og_image_url: data?.og_image_url ?? null,
  };
}

/* ------------------------------------------------------------ writing ---- */

export async function createMenu(name: string, location: MenuLocation | null): Promise<NavResult> {
  const supabase = await createClient();
  if (!name.trim()) return { error: "Give the menu a name." };

  const { data, error } = await supabase
    .from("menus")
    .insert({ name: name.trim(), location })
    .select("id")
    .single();

  if (error) return { error: msg(error.message, "create") };
  revalidateNav();
  return { ok: true, id: data.id as string };
}

export async function updateMenu(
  id: string,
  patch: { name?: string; location?: MenuLocation | null }
): Promise<NavResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menus").update(patch).eq("id", id);
  if (error) return { error: msg(error.message, "edit") };
  revalidateNav();
  return { ok: true };
}

export async function deleteMenu(id: string): Promise<NavResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menus").delete().eq("id", id);
  if (error) return { error: msg(error.message, "delete") };
  revalidateNav();
  return { ok: true };
}

export async function addMenuItem(
  menuId: string,
  item: {
    label: string;
    item_type: MenuItemType;
    page_id?: string | null;
    external_url?: string | null;
    parent_id?: string | null;
  }
): Promise<NavResult> {
  const supabase = await createClient();
  if (!item.label.trim()) return { error: "Give the item a label." };
  if (item.item_type === "page" && !item.page_id) return { error: "Choose a page to link to." };
  if (item.item_type !== "page" && !item.external_url?.trim())
    return { error: "Enter a URL." };

  // Append. Position is a stored integer rather than an array index so ordering
  // survives concurrent edits from two admins.
  const { data: last } = await supabase
    .from("menu_items")
    .select("position")
    .eq("menu_id", menuId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("menu_items").insert({
    menu_id: menuId,
    label: item.label.trim(),
    item_type: item.item_type,
    page_id: item.item_type === "page" ? item.page_id : null,
    external_url: item.item_type === "page" ? null : item.external_url!.trim(),
    parent_id: item.parent_id ?? null,
    position: ((last?.position as number) ?? 0) + 1,
  });

  if (error) return { error: msg(error.message, "edit") };
  revalidateNav();
  return { ok: true };
}

export async function updateMenuItem(
  id: string,
  patch: Partial<Pick<MenuItem, "label" | "is_visible" | "open_in_new_tab" | "parent_id" | "position">>
): Promise<NavResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update(patch).eq("id", id);
  if (error) return { error: msg(error.message, "edit") };
  revalidateNav();
  return { ok: true };
}

export async function deleteMenuItem(id: string): Promise<NavResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) return { error: msg(error.message, "delete") };
  revalidateNav();
  return { ok: true };
}

/** Persists a whole ordering in one pass, so a reorder cannot half-apply. */
export async function reorderMenuItems(
  ordered: { id: string; position: number; parent_id: string | null }[]
): Promise<NavResult> {
  const supabase = await createClient();

  // One statement, so a failure part-way cannot leave half an ordering behind.
  // The loop this replaces returned early on the first error and left the rest
  // of the menu at its previous positions.
  const { error } = await supabase.rpc("reorder_menu_items", { p_items: ordered });
  if (error) return { error: msg(error.message, "reorder") };

  revalidateNav();
  return { ok: true };
}

export async function setHomepage(pageId: string | null): Promise<NavResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_settings")
    .update({ homepage_page_id: pageId })
    .eq("id", true);

  if (error) return { error: msg(error.message, "edit") };
  revalidatePath("/", "layout");
  // The admin homepage screen reads this setting to decide whether to jump
  // straight to the builder, so it has to be invalidated too — revalidating
  // only the public tree left that screen showing a stale empty state.
  revalidatePath("/admin/content/homepage");
  revalidatePath("/admin/content/navigation");
  return { ok: true };
}

/**
 * Navigation appears in the layout of every public page, so a menu change has
 * to invalidate the whole public tree rather than a single route.
 */
function revalidateNav() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/content/navigation");
}
