"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Testimonials and pricing packages — the last two entities the public site
 * rendered from hardcoded arrays.
 *
 * Both are moderated: nothing reaches a visitor until `is_published` is set,
 * and the RLS policy is what enforces that rather than a filter in these
 * queries. An anonymous caller hitting the REST endpoint directly gets the same
 * answer the site does.
 */

export type TestimonialRow = Database["public"]["Tables"]["testimonials"]["Row"];
export type PricingPackageRow = Database["public"]["Tables"]["pricing_packages"]["Row"];

export type Testimonial = TestimonialRow & { organizationName: string | null };
export type PricingPackage = PricingPackageRow & { serviceSlug: string | null };

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

/* ------------------------------------------------------- testimonials -- */

/** Published testimonials for the public site, ordered as the editor arranged. */
export async function listPublishedTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*, organization:organizations ( name )")
    .eq("is_published", true)
    .order("display_order")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as (TestimonialRow & {
    organization: { name: string } | null;
  })[]).map((t) => ({ ...t, organizationName: t.organization?.name ?? null }));
}

/** Everything, for the admin moderation screen. RLS decides who gets drafts. */
export async function listAllTestimonials(): Promise<Testimonial[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("testimonials")
    .select("*, organization:organizations ( name )")
    .order("display_order")
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as (TestimonialRow & {
    organization: { name: string } | null;
  })[]).map((t) => ({ ...t, organizationName: t.organization?.name ?? null }));
}

export async function saveTestimonial(formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  const authorName = String(formData.get("authorName") ?? "").trim();
  if (authorName.length < 2) return { error: "Who said it?" };
  if (quote.length < 11) return { error: "The quote is too short to publish." };

  const ratingRaw = Number(formData.get("rating") ?? 0);
  const values = {
    author_name: authorName,
    author_role: String(formData.get("authorRole") ?? "").trim() || null,
    organization_id: (formData.get("organizationId") as string) || null,
    quote,
    rating: ratingRaw >= 1 && ratingRaw <= 5 ? Math.round(ratingRaw) : null,
    is_published: formData.get("isPublished") === "on",
    is_featured: formData.get("isFeatured") === "on",
  };

  const { error } = id
    ? await supabase.from("testimonials").update(values).eq("id", id)
    : await supabase.from("testimonials").insert(values);
  if (error) return { error: friendly(error.message, "save that testimonial") };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);
  if (error) return { error: friendly(error.message, "delete that testimonial") };

  revalidatePath("/admin/reviews");
  revalidatePath("/");
  return { ok: true };
}

/* ---------------------------------------------------- pricing packages -- */

export async function listPublishedPackages(): Promise<PricingPackage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_packages")
    .select("*, service:pages ( slug )")
    .eq("is_published", true)
    .order("display_order")
    .order("name");

  return ((data ?? []) as unknown as (PricingPackageRow & {
    service: { slug: string } | null;
  })[]).map((p) => ({
    ...p,
    // Stored as `services/<slug>`; the public route wants the bare slug.
    serviceSlug: p.service?.slug?.replace(/^services\//, "") ?? null,
  }));
}

export async function listAllPackages(): Promise<PricingPackage[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_packages")
    .select("*, service:pages ( slug )")
    .order("display_order")
    .order("name");

  return ((data ?? []) as unknown as (PricingPackageRow & {
    service: { slug: string } | null;
  })[]).map((p) => ({
    ...p,
    serviceSlug: p.service?.slug?.replace(/^services\//, "") ?? null,
  }));
}

export async function savePackage(formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const id = String(formData.get("id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 2) return { error: "Give the package a name." };

  const slug =
    String(formData.get("slug") ?? "").trim() ||
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const amountRaw = String(formData.get("priceAmount") ?? "").trim();
  const features = String(formData.get("features") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const values = {
    name,
    slug,
    blurb: String(formData.get("blurb") ?? "").trim() || null,
    // Empty means bespoke, not free. A zero here would render as "$0".
    price_amount: amountRaw ? Number(amountRaw) : null,
    price_period: (formData.get("pricePeriod") as string) || null,
    model: String(formData.get("model") ?? "Project"),
    category: String(formData.get("category") ?? "").trim() || null,
    features,
    service_page_id: (formData.get("servicePageId") as string) || null,
    is_published: formData.get("isPublished") === "on",
    is_featured: formData.get("isFeatured") === "on",
    display_order: Number(formData.get("displayOrder") ?? 0) || 0,
  };

  const { error } = id
    ? await supabase.from("pricing_packages").update(values).eq("id", id)
    : await supabase.from("pricing_packages").insert(values);
  if (error) {
    return {
      error: error.message.includes("pricing_packages_slug_key")
        ? "A package already uses that web address."
        : friendly(error.message, "save that package"),
    };
  }

  revalidatePath("/admin/services");
  revalidatePath("/pricing");
  return { ok: true };
}

export async function deletePackage(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("pricing_packages").delete().eq("id", id);
  if (error) return { error: friendly(error.message, "delete that package") };

  revalidatePath("/admin/services");
  revalidatePath("/pricing");
  return { ok: true };
}
