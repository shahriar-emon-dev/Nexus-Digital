"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";

/**
 * Media library server actions.
 *
 * Uploading is two writes that must agree: the object goes to storage, then a
 * row records its editorial metadata. If the row fails the object is removed
 * again, because an orphaned object is invisible to the library and can never
 * be cleaned up through the UI.
 */

export type MediaAsset = {
  id: string;
  storage_path: string;
  public_url: string;
  filename: string;
  mime_type: string;
  kind: "image" | "video" | "document" | "logo";
  size_bytes: number;
  width: number | null;
  height: number | null;
  alt_text: string | null;
  title: string | null;
  caption: string | null;
  folder: string;
  created_at: string;
};

export type MediaResult = { error: string } | { ok: true };

const MAX_BYTES = 25 * 1024 * 1024;

/** Derived from the MIME type so the caller cannot mislabel an upload. */
function kindFor(mime: string): MediaAsset["kind"] {
  if (mime.startsWith("video/")) return "video";
  if (mime === "application/pdf") return "document";
  if (mime === "image/svg+xml") return "logo";
  return "image";
}

/** Keeps the stored name predictable and safe as a URL path segment. */
function safeName(name: string): string {
  const dot = name.lastIndexOf(".");
  const stem = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  const ext = (dot > 0 ? name.slice(dot + 1) : "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  return `${stem || "file"}.${ext}`;
}

export async function listMedia(): Promise<MediaAsset[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("media_assets")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as MediaAsset[];
}

export async function uploadMedia(formData: FormData): Promise<MediaResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  if (file.size > MAX_BYTES) return { error: "Files must be 25 MB or smaller." };

  const folderRaw = String(formData.get("folder") ?? "").trim().toLowerCase();
  const folder = folderRaw.replace(/[^a-z0-9/-]/g, "");
  if (folderRaw && folder !== folderRaw) {
    return { error: "Folders may use lowercase letters, numbers, hyphens and slashes only." };
  }

  const path = `${folder ? `${folder}/` : ""}${Date.now()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) {
    return {
      error: uploadError.message.includes("row-level security")
        ? "You do not have permission to upload media."
        : uploadError.message,
    };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("media").getPublicUrl(path);

  const { error } = await supabase.from("media_assets").insert({
    storage_path: path,
    public_url: publicUrl,
    filename: file.name,
    mime_type: file.type || "application/octet-stream",
    kind: kindFor(file.type),
    size_bytes: file.size,
    folder,
    // Explicitly null, not empty string: nobody has written alt text yet, which
    // is different from an image deliberately marked decorative.
    alt_text: null,
    uploaded_by: user.id,
  });

  if (error) {
    // Roll the object back so storage and the table cannot disagree.
    await supabase.storage.from("media").remove([path]);
    return { error: error.message };
  }

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function updateMedia(id: string, formData: FormData): Promise<MediaResult> {
  const supabase = await createClient();

  const alt = String(formData.get("altText") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const caption = String(formData.get("caption") ?? "").trim();

  if (alt.length > 300) return { error: "Alt text is limited to 300 characters." };
  if (title.length > 200) return { error: "Title is limited to 200 characters." };
  if (caption.length > 600) return { error: "Caption is limited to 600 characters." };

  const { error } = await supabase
    .from("media_assets")
    .update({
      // The empty string is preserved rather than nulled: it marks the image as
      // decorative, which assistive technology treats differently from missing.
      alt_text: alt,
      title: title || null,
      caption: caption || null,
    })
    .eq("id", id);

  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "You do not have permission to edit media."
        : error.message,
    };
  }

  revalidatePath("/admin/media");
  return { ok: true };
}

export async function deleteMedia(id: string): Promise<MediaResult> {
  const supabase = await createClient();

  const { data: asset } = await supabase
    .from("media_assets")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!asset) return { error: "That asset no longer exists." };

  // Row first. If storage removal fails the object is orphaned but invisible,
  // which is recoverable; deleting the object first and failing the row would
  // leave the library pointing at a dead URL.
  const { error } = await supabase.from("media_assets").delete().eq("id", id);
  if (error) {
    return {
      error: error.message.includes("row-level security")
        ? "You do not have permission to delete media."
        : error.message,
    };
  }

  await supabase.storage.from("media").remove([asset.storage_path as string]);

  revalidatePath("/admin/media");
  return { ok: true };
}

/** Whether the signed-in role may manage media, for rendering read-only mode. */
export async function canEditMedia(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!data?.role_id) return false;

  const { data: grant } = await supabase
    .from("role_grants")
    .select("level")
    .eq("role_id", data.role_id)
    .eq("module_id", "content-publishing")
    .maybeSingle();

  const level = grant?.level as string | undefined;
  return level === "edit" || level === "admin" || level === "full";
}
