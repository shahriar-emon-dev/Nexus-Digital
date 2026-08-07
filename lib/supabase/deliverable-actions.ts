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
