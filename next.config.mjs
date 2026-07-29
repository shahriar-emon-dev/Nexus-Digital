/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `next build` and `next dev` share `.next/` by default, so running a build
  // while a dev server is up overwrites the chunks that server is still holding
  // in memory — it then 500s with "Cannot find module './<id>.js'" until the
  // cache is cleared. Set NEXT_DIST_DIR to build into a separate directory:
  //   NEXT_DIST_DIR=.next-build npx next build
  distDir: process.env.NEXT_DIST_DIR || ".next",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
