import type { MetadataRoute } from "next";

import { legalDocuments } from "@/lib/legal";
import { siteUrl } from "@/lib/site";
import {
  listPublishedCaseStudies,
  listPublishedPosts,
} from "@/lib/supabase/content-queries";
import { listPublishedServices } from "@/lib/supabase/service-actions";

/**
 * Public surface only. Portal routes are excluded here and in robots.ts —
 * listing them would invite crawling of client data.
 *
 * Async because the service list is now read from the CMS. Publishing a
 * service therefore puts it in the sitemap without a deploy, and unpublishing
 * one takes it out — neither used to be true.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statics = [
    { path: "/", priority: 1, freq: "weekly" as const },
    { path: "/about", priority: 0.8, freq: "monthly" as const },
    { path: "/services", priority: 0.9, freq: "weekly" as const },
    { path: "/case-studies", priority: 0.9, freq: "weekly" as const },
    { path: "/blog", priority: 0.8, freq: "daily" as const },
    { path: "/pricing", priority: 0.8, freq: "monthly" as const },
    { path: "/contact", priority: 0.7, freq: "monthly" as const },
    { path: "/reviews", priority: 0.6, freq: "monthly" as const },
    { path: "/book-meeting", priority: 0.6, freq: "monthly" as const },
  ].map((s) => ({
    url: `${siteUrl}${s.path}`,
    lastModified: now,
    changeFrequency: s.freq,
    priority: s.priority,
  }));

  // Only published services have a live page worth indexing.
  const serviceUrls = (await listPublishedServices()).map((s) => ({
    url: `${siteUrl}/services/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // Both from the CMS, so publishing a post lists it without a deploy and
  // unpublishing takes it out — neither used to be true.
  const postUrls = (await listPublishedPosts()).map((p) => ({
    url: `${siteUrl}/blog/${p.slug}`,
    lastModified: p.publishedOn ? new Date(p.publishedOn) : now,
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  const studyUrls = (await listPublishedCaseStudies()).map((s) => ({
    url: `${siteUrl}/case-studies/${s.slug}`,
    lastModified: s.publishedOn ? new Date(s.publishedOn) : now,
    changeFrequency: "yearly" as const,
    priority: 0.7,
  }));

  const legalUrls = legalDocuments.map((d) => ({
    url: `${siteUrl}/${d.slug}`,
    lastModified: new Date(d.updatedAt),
    changeFrequency: "yearly" as const,
    priority: 0.3,
  }));

  return [...statics, ...serviceUrls, ...postUrls, ...studyUrls, ...legalUrls];
}
