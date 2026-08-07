"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Project file sharing, backing the client and staff file screens.
 *
 * Files live in the `media` bucket under a project-scoped prefix. The bucket is
 * public, so the storage path is the only thing standing between a URL and the
 * file — which is why the path includes the project id and a timestamp rather
 * than being guessable from the file name alone.
 */

export type ProjectFileRow = Database["public"]["Tables"]["project_files"]["Row"];

export type ProjectFile = ProjectFileRow & {
  uploadedByName: string | null;
  projectName: string | null;
  url: string;
};

const MAX_BYTES = 25 * 1024 * 1024;

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

/** Strips anything that would change where a path resolves. */
const safeName = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(-120);

export async function listProjectFiles(projectId?: string): Promise<ProjectFile[]> {
  noStore();
  const supabase = await createClient();

  let query = supabase
    .from("project_files")
    .select("*, uploader:profiles ( full_name, email ), project:projects ( name )")
    .order("created_at", { ascending: false });
  if (projectId) query = query.eq("project_id", projectId);

  const { data } = await query;

  return ((data ?? []) as unknown as (ProjectFileRow & {
    uploader: { full_name: string | null; email: string } | null;
    project: { name: string } | null;
  })[]).map((f) => ({
    ...f,
    uploadedByName: f.uploader?.full_name || f.uploader?.email || null,
    projectName: f.project?.name ?? null,
    url: supabase.storage.from("media").getPublicUrl(f.storage_path).data.publicUrl,
  }));
}

export async function uploadProjectFile(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const projectId = String(formData.get("projectId") ?? "").trim();
  if (!projectId) return { error: "Choose a project to attach this to." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file first." };
  if (file.size > MAX_BYTES) return { error: "Files must be 25 MB or smaller." };

  const path = `projects/${projectId}/${Date.now()}-${safeName(file.name)}`;

  const { error: uploadError } = await supabase.storage
    .from("media")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: friendly(uploadError.message, "upload that file") };

  const { error } = await supabase.from("project_files").insert({
    project_id: projectId,
    uploaded_by: user.id,
    name: file.name,
    storage_path: path,
    mime_type: file.type || null,
    size_bytes: file.size,
  });
  if (error) {
    // The row is the record; an orphaned object in the bucket is worse than no
    // file at all because nothing will ever clean it up.
    await supabase.storage.from("media").remove([path]);
    return { error: friendly(error.message, "record that file") };
  }

  revalidatePath("/client/messages/files");
  revalidatePath("/staff/files");
  return { ok: true };
}

export async function deleteProjectFile(id: string): Promise<Result> {
  const supabase = await createClient();

  const { data: row } = await supabase
    .from("project_files")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.from("project_files").delete().eq("id", id);
  if (error) return { error: friendly(error.message, "delete that file") };

  if (row?.storage_path) await supabase.storage.from("media").remove([row.storage_path]);

  revalidatePath("/client/messages/files");
  revalidatePath("/staff/files");
  return { ok: true };
}
