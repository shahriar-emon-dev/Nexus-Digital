"use server";

import { revalidatePath } from "next/cache";

import { ID_PATTERNS } from "../derive";
import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Global site settings — the meta tags and analytics identifiers applied to
 * every public page.
 *
 * One row, one source. The previous module hardcoded these, which meant the
 * OG image pointed at a design-tool CDN URL that expires and could only be
 * replaced by a deploy.
 */

export type SiteSettings = Database["public"]["Tables"]["site_settings"]["Row"];

export async function getSiteSettings(): Promise<SiteSettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("*").maybeSingle();
  return (data as SiteSettings) ?? null;
}

type Result = { ok: true } | { error: string };

const GA4 = /^G-[A-Z0-9]{6,12}$/;
const GTM = /^GTM-[A-Z0-9]{5,9}$/;

export async function updateSiteSettings(form: FormData): Promise<Result> {
  const supabase = await createClient();

  const ga4 = String(form.get("ga4MeasurementId") ?? "").trim();
  const gtm = String(form.get("gtmContainerId") ?? "").trim();

  // Validated server-side as well as by the input pattern: an HTML attribute
  // is a hint to the browser, not a constraint on the request.
  if (ga4 && !GA4.test(ga4)) return { error: ID_PATTERNS.ga4.hint };
  if (gtm && !GTM.test(gtm)) return { error: ID_PATTERNS.gtm.hint };

  const title = String(form.get("defaultTitle") ?? "").trim();
  if (title.length > 120) return { error: "Title is too long to be useful in a search result." };

  const { error } = await supabase
    .from("site_settings")
    .update({
      ga4_measurement_id: ga4 || null,
      gtm_container_id: gtm || null,
      default_title: title || null,
      meta_description: String(form.get("metaDescription") ?? "").trim() || null,
      og_image_url: String(form.get("ogImage") ?? "").trim() || null,
      og_image_alt: String(form.get("ogImageAlt") ?? "").trim() || null,
      header_scripts: String(form.get("headerScripts") ?? "").trim() || null,
      body_start_scripts: String(form.get("bodyStartScripts") ?? "").trim() || null,
    })
    .eq("id", true);

  if (error) return { error: error.message };

  // These tags render on every public page, so the whole public tree is stale.
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { ok: true };
}

/**
 * Bank/transfer details shown to a client on an unpaid invoice.
 *
 * Separate from `updateSiteSettings` on purpose: that action owns the public
 * meta tags and is reachable from the SEO panel, and merging the two would mean
 * saving a meta description could blank the agency's bank details if the form
 * happened not to include them.
 *
 * Stored raw and rendered as plain text. No HTML sanitisation is applied
 * because no HTML is ever emitted — see PaymentPanel.
 */
export async function updatePaymentSettings(form: FormData): Promise<Result> {
  const supabase = await createClient();

  const instructions = String(form.get("paymentInstructions") ?? "").trim();
  const hint = String(form.get("paymentReferenceHint") ?? "").trim();

  if (instructions.length > 4000) {
    return { error: "Payment details are too long. Keep them under 4000 characters." };
  }
  if (hint.length > 160) return { error: "That reference hint is too long." };

  const { error } = await supabase
    .from("site_settings")
    .update({
      payment_instructions: instructions || null,
      payment_reference_hint: hint || null,
    })
    .eq("id", true);

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "Only an administrator can change payment details."
        : error.message,
    };
  }

  revalidatePath("/admin/settings");
  revalidatePath("/client/invoices");
  return { ok: true };
}
