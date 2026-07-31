import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/site";

/**
 * Portal routes are behind auth and hold client data — they must never be
 * crawled, and `disallow` documents that intent even before auth is enforced.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/client/", "/staff/", "/auth/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
