import { redirect } from "next/navigation";

/**
 * `/admin/analytics` is a section, not a screen — SEO Overview and Keywords
 * are its two pages. A landing page here would either duplicate the overview
 * or be an index of two links, so it forwards instead.
 */
export default function AdminAnalyticsPage() {
  redirect("/admin/analytics/seo");
}
