/** @type {import('next').NextConfig} */

/**
 * The Supabase project host, derived from the same variable the client uses so
 * the two can never disagree. Storage objects are served from
 * `<project>.supabase.co/storage/v1/object/public/...`.
 */
const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname || null;
  } catch {
    return null;
  }
})();

const nextConfig = {
  reactStrictMode: true,
  // `next build` and `next dev` share `.next/` by default, so running a build
  // while a dev server is up overwrites the chunks that server is still holding
  // in memory — it then 500s with "Cannot find module './<id>.js'" until the
  // cache is cleared. Set NEXT_DIST_DIR to build into a separate directory:
  //   NEXT_DIST_DIR=.next-build npx next build
  distDir: process.env.NEXT_DIST_DIR || ".next",

  images: {
    /**
     * This was `hostname: '**'`.
     *
     * `remotePatterns` is not a convenience list — it is the allowlist for the
     * image optimiser, and the optimiser is a public endpoint. With a wildcard,
     * `/_next/image?url=https://anything/...` turns this deployment into an
     * open image proxy: a third party can serve their bytes from your domain,
     * on your bandwidth and your CPU, and anything fetched inherits your
     * origin's reputation. It also gives an unauthenticated caller a
     * server-side fetch primitive aimed at a host of their choosing.
     *
     * The list below is every origin the application actually loads images
     * from. An admin who needs another one adds it here, in a commit, rather
     * than the door standing open for all of them.
     */
    remotePatterns: [
      // Supabase Storage — everything uploaded through the media library.
      ...(supabaseHost
        ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
        : []),
      // Placeholder imagery that shipped with the original UI mockups. These
      // are Google-hosted design assets, not files you control — replace them
      // with uploads to the media library and this entry can go.
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
};

export default nextConfig;
