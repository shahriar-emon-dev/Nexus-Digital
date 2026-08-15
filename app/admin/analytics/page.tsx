import { redirect } from "next/navigation";

/**
 * `/admin/analytics` is a section, not a screen. It forwards to the business
 * overview — the eight-chart dashboard spec §12.1 asks for — rather than to
 * the SEO page, which answers a narrower question.
 */
export default function AdminAnalyticsPage() {
  redirect("/admin/analytics/overview");
}
