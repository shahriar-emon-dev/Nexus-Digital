"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Deliverables under client review.
 *
 * Replaces lib/deliverables.ts, which held two invented deliverables, their
 * versions and their annotations — including image URLs from a design tool that
 * will expire. Approving one changed nothing.
 */

export type DeliverableRow = Database["public"]["Tables"]["deliverables"]["Row"];
export type VersionRow = Database["public"]["Tables"]["deliverable_versions"]["Row"];
export type AnnotationRow = Database["public"]["Tables"]["deliverable_annotations"]["Row"];

export type Deliverable = DeliverableRow & {
  projectName: string | null;
  ownerName: string | null;
  versions: VersionRow[];
};

export type Annotation = AnnotationRow & { authorName: string };

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

export async function listDeliverables(): Promise<Deliverable[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("deliverables")
    .select("*, project:projects ( name ), owner:profiles ( full_name, email )")
    .order("updated_at", { ascending: false });

  const rows = (data ?? []) as unknown as (DeliverableRow & {
    project: { name: string } | null;
    owner: { full_name: string | null; email: string } | null;
  })[];
  if (rows.length === 0) return [];

  const { data: versions } = await supabase
    .from("deliverable_versions")
    .select("*")
    .in("deliverable_id", rows.map((d) => d.id))
    .order("released_on", { ascending: false });

  const byDeliverable = new Map<string, VersionRow[]>();
  for (const v of (versions ?? []) as VersionRow[]) {
    const list = byDeliverable.get(v.deliverable_id) ?? [];
    list.push(v);
    byDeliverable.set(v.deliverable_id, list);
  }

  return rows.map((d) => ({
    ...d,
    projectName: d.project?.name ?? null,
    ownerName: d.owner?.full_name || d.owner?.email || null,
    versions: byDeliverable.get(d.id) ?? [],
  }));
}

export async function getDeliverable(id: string): Promise<Deliverable | null> {
  const all = await listDeliverables();
  return all.find((d) => d.id === id) ?? null;
}

/**
 * Puts a deliverable in front of a client.
 *
 * The review surface was complete — versions, annotations, resolve, approve,
 * request-changes, realtime — over a table nothing could write to. Staff had no
 * way to submit work, so `deliverables` held zero rows and the entire client
 * approval loop was dead on arrival.
 *
 * A deliverable is created together with its first version: one with no version
 * renders as an empty review canvas, which reads as a bug rather than as
 * "nothing uploaded yet".
 */
export async function createDeliverable(
  formData: FormData
): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const projectId = String(formData.get("projectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const discipline = String(formData.get("discipline") ?? "").trim() || null;
  const taskId = String(formData.get("taskId") ?? "").trim() || null;
  const versionLabel = String(formData.get("versionLabel") ?? "").trim() || "v1";
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim() || null;
  const alt = String(formData.get("alt") ?? "").trim() || null;
  const summary = String(formData.get("summary") ?? "").trim() || null;

  if (!projectId) return { error: "Choose a project." };
  if (title.length < 2) return { error: "Give the deliverable a title." };
  if (title.length > 200) return { error: "That title is too long." };
  if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
    return { error: "The asset link must be a full http(s) URL." };
  }

  const { data: deliverable, error } = await supabase
    .from("deliverables")
    .insert({
      project_id: projectId,
      task_id: taskId,
      title,
      discipline,
      status: "In review",
      owner_id: user.id,
    })
    .select("id")
    .single();

  if (error || !deliverable) {
    return { error: friendly(error?.message ?? "Unknown error", "create that deliverable") };
  }

  const { error: versionError } = await supabase.from("deliverable_versions").insert({
    deliverable_id: deliverable.id,
    label: versionLabel,
    media_url: mediaUrl,
    alt,
    summary,
  });

  if (versionError) {
    await supabase.from("deliverables").delete().eq("id", deliverable.id);
    return { error: friendly(versionError.message, "attach the first version") };
  }

  revalidatePath("/client/deliverables");
  revalidatePath("/client/projects");
  revalidatePath("/staff/projects");
  return { ok: true, id: deliverable.id };
}

/**
 * Adds a revision.
 *
 * Submitting a new version moves the deliverable back to "In review": a client
 * who requested changes should not see that badge sitting over work which has
 * since been redone.
 */
export async function addDeliverableVersion(
  deliverableId: string,
  formData: FormData
): Promise<Result> {
  const supabase = await createClient();

  const label = String(formData.get("versionLabel") ?? "").trim();
  const mediaUrl = String(formData.get("mediaUrl") ?? "").trim() || null;
  const alt = String(formData.get("alt") ?? "").trim() || null;
  const summary = String(formData.get("summary") ?? "").trim() || null;

  if (label.length < 1) return { error: "Label this version." };
  if (mediaUrl && !/^https?:\/\//i.test(mediaUrl)) {
    return { error: "The asset link must be a full http(s) URL." };
  }

  const { error } = await supabase.from("deliverable_versions").insert({
    deliverable_id: deliverableId,
    label,
    media_url: mediaUrl,
    alt,
    summary,
  });
  if (error) return { error: friendly(error.message, "add that version") };

  await supabase.from("deliverables").update({ status: "In review" }).eq("id", deliverableId);

  revalidatePath("/client/deliverables");
  revalidatePath("/staff/projects");
  return { ok: true };
}

export async function listAnnotations(versionId: string): Promise<Annotation[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("deliverable_annotations")
    .select("*, author:profiles ( full_name, email )")
    .eq("version_id", versionId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as (AnnotationRow & {
    author: { full_name: string | null; email: string } | null;
  })[]).map((a) => ({
    ...a,
    authorName: a.author?.full_name || a.author?.email || "Former member",
  }));
}

export async function addAnnotation(
  versionId: string,
  x: number,
  y: number,
  body: string
): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const text = body.trim();
  if (!text) return { error: "Write a comment first." };

  const { error } = await supabase.from("deliverable_annotations").insert({
    version_id: versionId,
    author_id: user.id,
    // Clamped rather than trusted: a pin outside the image would be invisible
    // and the check constraint would reject the row anyway.
    x: Math.min(1, Math.max(0, x)),
    y: Math.min(1, Math.max(0, y)),
    body: text,
  });
  if (error) return { error: friendly(error.message, "add that comment") };

  revalidatePath("/client/deliverables");
  return { ok: true };
}

export async function resolveAnnotation(id: string, resolved: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("deliverable_annotations")
    .update({ resolved })
    .eq("id", id);
  if (error) return { error: friendly(error.message, "update that comment") };

  revalidatePath("/client/deliverables");
  return { ok: true };
}

export async function setDeliverableStatus(
  id: string,
  status: Database["public"]["Enums"]["deliverable_status"]
): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("deliverables").update({ status }).eq("id", id);
  if (error) return { error: friendly(error.message, "update that deliverable") };

  revalidatePath("/client/deliverables");
  revalidatePath("/client/projects");
  return { ok: true };
}
