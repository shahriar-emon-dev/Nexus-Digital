import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * Counts for the admin sidebar badges.
 *
 * These were literals — `badge: 4` on Financials and `badge: 2` on Review
 * Moderation — sitting in the nav definition. With an empty database the rail
 * still advertised six items of outstanding work, and clicking either one led
 * to an empty screen. A nav badge is a promise that something is waiting; a
 * hardcoded one is the most quietly misleading kind of mock data, because it
 * is read at a glance on every single page.
 *
 * A count of zero returns `undefined` rather than 0 so the badge disappears
 * entirely. A grey "0" is noise that trains people to stop reading badges.
 */

export type NavBadges = {
  invoices?: number;
  reviews?: number;
};

export async function getNavBadges(): Promise<NavBadges> {
  noStore();
  const supabase = await createClient();

  const [openInvoices, pendingReviews] = await Promise.all([
    // Anything issued and not yet settled. Void is excluded — a cancelled
    // invoice is not outstanding work.
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .in("status", ["draft", "sent", "overdue"]),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

  // RLS decides what this role can see, so a financial-auditor and a content
  // editor get different numbers here — each correct for the person reading it.
  return {
    invoices: openInvoices.count || undefined,
    reviews: pendingReviews.count || undefined,
  };
}
