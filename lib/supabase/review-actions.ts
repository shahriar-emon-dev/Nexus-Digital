"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Reviews: the single data module for the moderation queue, the public wall
 * and the submission form.
 *
 * Approval state lives in one column and one RLS policy. Nothing here decides
 * what the public may see — `reviews_select_public` does, so a query written
 * later without a `status` filter still cannot leak a pending review.
 */

export type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewStatus = Database["public"]["Enums"]["review_status"];

export type ReviewWithContext = ReviewRow & {
  organizations: { name: string } | null;
  projects: { name: string; slug: string } | null;
};

const SELECT =
  "*, organizations ( name ), projects ( name, slug )";

/** Everything a moderator may see: pending, approved and rejected alike. */
export async function listReviewsForModeration(): Promise<ReviewWithContext[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(SELECT)
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as ReviewWithContext[];
}

/**
 * The public wall. Approved only — enforced twice, once here for the index and
 * once by RLS for anyone who bypasses this function.
 */
export async function listApprovedReviews(): Promise<ReviewWithContext[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select(SELECT)
    .eq("status", "approved")
    .order("is_featured", { ascending: false })
    .order("display_order")
    .order("created_at", { ascending: false });

  return (data ?? []) as unknown as ReviewWithContext[];
}

/* ------------------------------------------------------------- mutations -- */

type Result<T = void> = T extends void ? { ok: true } | { error: string } : { ok: true; data: T } | { error: string };

/**
 * Moves a review between states.
 *
 * `moderated_at` is set here rather than defaulted in the schema because the
 * CHECK constraint pairs it with the status — a row that says "approved" with
 * no timestamp is rejected by the database, which is what makes the audit
 * trail on this table trustworthy.
 */
export async function setReviewStatus(
  id: string,
  status: ReviewStatus,
  note?: string
): Promise<Result> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("reviews")
    .update({
      status,
      moderated_at: status === "pending" ? null : new Date().toISOString(),
      moderated_by: status === "pending" ? null : auth.user.id,
      moderation_note: note?.trim() || null,
    })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function setReviewFeatured(id: string, featured: boolean): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_featured: featured })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true };
}

/** Bulk moderation, used by the queue's selection toolbar. */
export async function setReviewStatusBulk(
  ids: string[],
  status: ReviewStatus
): Promise<Result<{ count: number }>> {
  if (ids.length === 0) return { error: "Nothing selected." };
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: "Not signed in." };

  const { data, error } = await supabase
    .from("reviews")
    .update({
      status,
      moderated_at: status === "pending" ? null : new Date().toISOString(),
      moderated_by: status === "pending" ? null : auth.user.id,
    })
    .in("id", ids)
    .select("id");

  if (error) return { error: error.message };

  revalidatePath("/admin/reviews");
  revalidatePath("/reviews");
  return { ok: true, data: { count: (data ?? []).length } };
}

/**
 * Public submission.
 *
 * Status is not accepted from the caller. The insert policy pins it to
 * `pending` anyway, but sending it explicitly makes the intent readable at the
 * call site rather than hidden in a policy two files away.
 */
export async function submitReview(form: FormData): Promise<Result> {
  const supabase = await createClient();

  const authorName = String(form.get("authorName") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const rating = Number(form.get("rating") ?? 0);

  if (authorName.length < 2) return { error: "Please give your name." };
  if (body.length < 10) return { error: "Please write at least a sentence." };
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Please choose a rating from 1 to 5." };
  }

  const { data: auth } = await supabase.auth.getUser();

  const { error } = await supabase.from("reviews").insert({
    author_id: auth.user?.id ?? null,
    author_name: authorName,
    author_role: String(form.get("authorRole") ?? "").trim() || null,
    author_company: String(form.get("authorCompany") ?? "").trim() || null,
    title: String(form.get("title") ?? "").trim() || null,
    rating,
    body,
    status: "pending",
  });

  if (error) return { error: error.message };
  revalidatePath("/admin/reviews");
  return { ok: true };
}
