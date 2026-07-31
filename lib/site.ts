/**
 * Canonical origin, used by `metadataBase`, the sitemap and robots.txt.
 *
 * Lives here rather than in `app/layout.tsx` because a route file may only
 * export the handful of names Next reserves — an extra export there is a build
 * error, not a lint warning.
 */
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://nexus.agency";
