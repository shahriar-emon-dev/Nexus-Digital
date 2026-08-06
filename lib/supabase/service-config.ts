"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * The Service Configuration pane that sits beside the page canvas.
 *
 * A service IS a page, so this owns only the catalogue fields a page does not
 * carry — category, price, lead time, cover media. Content, slug, publish state
 * and version history stay with the page, which is why the editor gains a pane
 * rather than services gaining a second editor.
 */

export type ServiceConfig = Database["public"]["Tables"]["service_details"]["Row"];

export async function getServiceConfig(pageId: string): Promise<ServiceConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("service_details")
    .select("*")
    .eq("page_id", pageId)
    .maybeSingle();
  return (data as ServiceConfig) ?? null;
}

type Result = { ok: true } | { error: string };

export async function updateServiceConfig(pageId: string, form: FormData): Promise<Result> {
  const supabase = await createClient();

  const price = form.get("priceFrom");
  const lead = form.get("leadTimeWeeks");

  const priceValue = price === null || String(price).trim() === "" ? null : Number(price);
  if (priceValue !== null && (!Number.isFinite(priceValue) || priceValue < 0)) {
    return { error: "Starting price cannot be negative." };
  }

  const leadValue = lead === null || String(lead).trim() === "" ? null : Number(lead);
  if (leadValue !== null && (!Number.isInteger(leadValue) || leadValue < 0 || leadValue > 260)) {
    return { error: "Lead time must be a whole number of weeks between 0 and 260." };
  }

  const { error } = await supabase
    .from("service_details")
    .update({
      category: String(form.get("category") ?? "").trim() || "Engineering",
      // Empty stays null: "not priced yet" and "free" are different claims.
      price_from: priceValue,
      lead_time_weeks: leadValue,
      summary: String(form.get("summary") ?? "").trim() || null,
      cover_image_url: String(form.get("coverImageUrl") ?? "").trim() || null,
      cover_image_alt: String(form.get("coverImageAlt") ?? "").trim() || null,
    })
    .eq("page_id", pageId);

  if (error) return { error: error.message };

  revalidatePath("/admin/services");
  revalidatePath(`/admin/content/pages/${pageId}`);
  revalidatePath("/services");
  return { ok: true };
}
