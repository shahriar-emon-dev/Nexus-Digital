"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type { Portal, Profile } from "./types";

/**
 * Server Actions for profile self-service.
 *
 * Field selection matters here. `portal`, `role_id`, `is_active` and
 * `organization_id` are never accepted from these actions — a database trigger
 * rejects them for non-admins anyway, but sending them at all invites the
 * mistake. Only fields a person owns are read off the form.
 */

export type ProfileResult = { error: string } | { ok: true };

export type ProfileWithOrg = Profile & {
  organizations: { id: string; name: string; slug: string; industry: string | null; tier: string } | null;
  roles: { id: string; name: string; description: string } | null;
};

/** The signed-in user's profile with its organisation and role joined. */
export async function getMyProfile(): Promise<ProfileWithOrg | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*, organizations(id, name, slug, industry, tier), roles(id, name, description)")
    .eq("id", user.id)
    .single();

  return (data as ProfileWithOrg | null) ?? null;
}

export async function updateMyProfile(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const fullName = String(formData.get("fullName") ?? "").trim();
  if (!fullName) return { error: "Name cannot be empty." };
  if (fullName.length > 120) return { error: "Name is too long (120 characters max)." };

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > 600) return { error: "Bio is too long (600 characters max)." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      job_title: String(formData.get("jobTitle") ?? "").trim() || null,
      phone: String(formData.get("phone") ?? "").trim() || null,
      bio: bio || null,
      timezone: String(formData.get("timezone") ?? "UTC"),
    })
    .eq("id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

/**
 * Stores the avatar under `<user-id>/<timestamp>.<ext>`.
 *
 * The folder name is what the storage policy checks, so a user can only ever
 * write inside their own prefix. The timestamp defeats CDN caching of a
 * replaced image, which is otherwise the usual "I uploaded a new avatar and
 * nothing changed" complaint.
 */
export async function updateMyAvatar(formData: FormData): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose an image first." };
  if (file.size > 2 * 1024 * 1024) return { error: "Images must be 2 MB or smaller." };

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!allowed.includes(file.type)) return { error: "Use a PNG, JPEG, WebP or GIF." };

  const ext = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${user.id}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });
  if (uploadError) return { error: uploadError.message };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMyAvatar(): Promise<ProfileResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { data: files } = await supabase.storage.from("avatars").list(user.id);
  if (files?.length) {
    await supabase.storage
      .from("avatars")
      .remove(files.map((f) => `${user.id}/${f.name}`));
  }

  const { error } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { ok: true };
}

/* ------------------------------------------------------ admin surfaces --- */

/**
 * Every profile, for admin user management. RLS is the gate — a non-admin
 * calling this simply gets their own row back rather than an error, so the
 * screen degrades instead of leaking.
 */
export async function listProfiles(): Promise<ProfileWithOrg[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*, organizations(id, name, slug, industry, tier), roles(id, name, description)")
    .order("created_at", { ascending: false });

  return (data as ProfileWithOrg[] | null) ?? [];
}

/** Admin-only. The database trigger enforces this regardless of who calls it. */
export async function assignPortalAndRole(
  userId: string,
  portal: Portal,
  roleId: string | null
): Promise<ProfileResult> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({ portal, role_id: roleId })
    .eq("id", userId);

  if (error) {
    // 42501 is the guard trigger refusing a non-admin caller.
    return {
      error: error.message.includes("administrator")
        ? "Only an administrator can change a portal or role."
        : error.message,
    };
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function setProfileActive(userId: string, isActive: boolean): Promise<ProfileResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: isActive }).eq("id", userId);
  if (error) return { error: error.message };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
