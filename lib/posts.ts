/**
 * Editorial content — the single source for `/blog` and `/blog/[slug]`.
 *
 * Authors are referenced by `TeamMember.id` rather than duplicated, so a person
 * has one record across the whole site. Shaped for the eventual `Post` table:
 * body is an ordered list of typed blocks, which maps cleanly to a JSON column
 * or a `PostBlock` relation.
 */
import { leadership, type TeamMember } from "./team";

export type Category =
  | "Engineering"
  | "Growth Strategy"
  | "AI & Automation"
  | "Case Decodes"
  | "Design";

export const categoryTone: Record<Category, string> = {
  Engineering: "border-ion/20 bg-ion/15 text-ion",
  "Growth Strategy": "border-chart-3/20 bg-chart-3/15 text-chart-3",
  "AI & Automation": "border-brand/30 bg-brand/20 text-brand",
  "Case Decodes": "border-transparent bg-brand text-brand-fg",
  Design: "border-chart-4/20 bg-chart-4/15 text-chart-4",
};

export type Block =
  | { kind: "section"; id: string; heading: string }
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string; cite: string }
  | { kind: "code"; filename: string; language: string; code: string }
  | { kind: "callout"; title: string; body: string }
  | { kind: "stats"; items: { value: string; label: string; tone: "brand" | "ion" | "ink" }[] }
  | { kind: "cta"; heading: string; body: string; label: string; href: string };

export type Post = {
  id: string;
  slug: string;
  title: string;
  /** Rendered in the accent colour on the detail hero. */
  titleAccent?: string;
  excerpt: string;
  category: Category;
  readMinutes: number;
  publishedAt: string;
  authorId: TeamMember["id"];
  image: string;
  /** Promoted to the index hero. Exactly one post should carry this. */
  featured?: boolean;
  /** Given the travelling border in the grid. */
  highlight?: boolean;
  /** Shown over the hero image on the index. */
  metrics?: { label: string; value: string; tone: "brand" | "ion" }[];
  body?: Block[];
};

export const authorFor = (post: Post) => leadership.find((m) => m.id === post.authorId);

const formatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});
export const formatDate = (iso: string) => formatter.format(new Date(iso));

/* TODO: every `image` is a design-tool CDN URL and will expire. */
export const posts: Post[] = [
  {
    id: "predictive-ui",
    slug: "future-of-predictive-ui",
    title: "The Future of Predictive UI: Beyond Component-Based Design",
    excerpt:
      "How generative interfaces are reshaping the user journey through real-time architectural adaptation and autonomous visual decision-making.",
    category: "AI & Automation",
    readMinutes: 7,
    publishedAt: "2026-06-18",
    authorId: "alex-vance",
    featured: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDd46JDJNa99u_FVjQx_-buHFGMsmlJxHclQ-VE1hWzx2cEuNLVLSzlrc63dLhrf_mGWpdpkV1VzxSyzzA8TlsGTrYsBzNv1MJNymMUyZVYc6OkaR910SHJ1BImfq3qX2H8t7JsatAgGbPTwntYFpeUpyCNMinUf0xV_ojC4Zq-bMd-oO-xaED28kSLyaWM9Debxh19NTELqq9C6Qzb4-jBoTVJHn2UWCcMlX5kfQSVloALdXMTEb6tf2kRCrjbhpt1bRlpQMlr90fo",
    metrics: [
      { label: "Engagement", value: "94.2%", tone: "brand" },
      { label: "Velocity", value: "3.4s", tone: "ion" },
    ],
  },
  {
    id: "edge-computing",
    slug: "architecture-of-scalable-edge-computing",
    title: "The Architecture of Scalable Edge Computing",
    titleAccent: "Edge Computing",
    excerpt:
      "How we leveraged Next.js middleware and globally distributed edge functions to achieve sub-50ms latency for our high-traffic fintech partners.",
    category: "Engineering",
    readMinutes: 12,
    publishedAt: "2026-05-24",
    authorId: "sarah-chen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzWCCoVvnhluRgJ_SpZ8wRB9siXKsOkf09G6CbzcFQ_2HnrQ9HIcG8wF0VV1LeW8pqjoBYPNVLHsO1tZeGEiV3vtgWmCc8nfA1WQorCrDPlayt7BaKi7O0tbDXXvLl92_6T5eHczIeJsa6oUcaoE7Fyy0SQWI9AlSgw71cFw5WEKjQi_cu5_bYYVOW54kiszr0iEZbElZAf18AELv5o9okzRn5-eyGSmpsc6J1gKCOv9YEKxCgWGSV2VNIDNRfaq01h6H2YCe4rcS4",
    body: [
      { kind: "section", id: "the-challenge", heading: "The Challenge" },
      {
        kind: "p",
        text: 'As global traffic increases, the traditional "centralized server" model hits a bottleneck. For our latest fintech engagement, the requirement was absolute: transaction data must be validated and rendered in under 100ms, regardless of the user\'s geographical location.',
      },
      {
        kind: "p",
        text: "Traditional CDNs cache static assets, but the dynamic nature of financial ledgers requires compute power close to the user. We needed a solution that combined the speed of static delivery with the flexibility of server-side logic.",
      },
      {
        kind: "quote",
        text: "Edge computing isn't just about speed; it's about shifting the paradigm of where the 'brain' of your application lives.",
        cite: "Sarah Chen, Principal Engineer",
      },
      { kind: "section", id: "technical-architecture", heading: "Technical Architecture" },
      {
        kind: "p",
        text: "Our implementation utilizes Next.js Edge Runtime to intercept requests before they even reach the origin. By using geo-aware middleware, we can serve localized data fragments instantly.",
      },
      {
        kind: "code",
        filename: "middleware.ts",
        language: "TypeScript",
        code: `import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Compute locality at the edge
export function middleware(request: NextRequest) {
  const { nextUrl: url, geo } = request;
  const country = geo?.country || 'US';

  // Rewrite to localized edge fragment
  url.pathname = \`/_edge/\${country}\${url.pathname}\`;

  return NextResponse.rewrite(url);
}

export const config = {
  matcher: '/api/transactions/:path*',
};`,
      },
      {
        kind: "callout",
        title: "Key Takeaway",
        body: "Middleware execution happens in a specialized V8 sandbox. This means you have zero cold starts compared to traditional serverless functions, making it perfect for latency-sensitive tasks.",
      },
      {
        kind: "cta",
        heading: "Enjoying this technical breakdown?",
        body: "Our specialized engineering team helps brands implement high-performance architecture that scales globally.",
        label: "Schedule a Consultation",
        href: "/book-meeting",
      },
      { kind: "section", id: "result", heading: "Result" },
      {
        kind: "p",
        text: "After deploying the Edge-first architecture, the results were transformative. Median Time to First Byte (TTFB) dropped from 320ms to 42ms globally.",
      },
      {
        kind: "stats",
        items: [
          { value: "87%", label: "Latency Reduction", tone: "brand" },
          { value: "0ms", label: "Cold Start Delay", tone: "ion" },
          { value: "99.9%", label: "Cache Hit Ratio", tone: "ink" },
        ],
      },
      {
        kind: "p",
        text: "Scaling isn't just about adding more servers — it's about removing the friction between the user and the logic. By embracing the edge, we've created an infrastructure that is both resilient and lightning fast.",
      },
    ],
  },
  {
    id: "scaling-nextjs",
    slug: "scaling-nextjs-for-1m-users",
    title: "Scaling Next.js for 1M+ Concurrent Users",
    excerpt:
      "Optimizing infrastructure for global-scale applications through edge caching and reactive state hydration.",
    category: "Engineering",
    readMinutes: 12,
    publishedAt: "2026-10-12",
    authorId: "sarah-chen",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCJd8Y6VPHu_2aiaOaY4yig-UcNt-FTzmojjooWAbyNKZg03Zt7EK-F3HnZzCbUz4g9QMohPLYX4I36YQiTEO3AntbVXPPPJxAGRA4BgUesRQntN1oktPx95bEaC71iXj8SpNXCGtaGOgBCtc6yiRzqbZkk3M7dCcGgaz8CgTMR3NeI_uodd65CsZrrZhyAXOs12jqEU6xIeXOdNlwFl0ubQ_wdUuHlMVRcMr6xj9IC365zSBaMG9MB5Uvv1NCVzcdpTbycK774yD6s",
  },
  {
    id: "headless-roi",
    slug: "roi-of-headless-commerce",
    title: "The ROI of Headless Commerce",
    excerpt:
      "Why monolithic platforms are costing you 30% in conversion loss and how to pivot with zero downtime.",
    category: "Growth Strategy",
    readMinutes: 5,
    publishedAt: "2026-10-08",
    authorId: "elara-kent",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9VcTFuHTdI-pdrAPuUDq0vDI47VL1a3eRzoCMlpxfgGqOLQO0SpJYOvvPrzHilGA5CWFI7cth3r1SI_G6IF3Fw4cxIVJ3amhvzZnQDe3ezzIwgEBf9WEXhZ_4PNcluFGu05leXWz2HbssQ66oaqy2BeCf0o0mmOykVYKgb9basUvLoWn8Z16CT1iozmg8szk2vhRK218xrqKET05zV1sDg1DWjAaIiE6Xptu0cT5lSW9myUXHPyj0upecope1f0gtMsr4VlXro6b3",
  },
  {
    id: "astra-decode",
    slug: "deconstructing-the-astra-architecture",
    title: "Deconstructing the Astra Banking Architecture",
    excerpt:
      "A technical breakdown of how we built a zero-latency global banking engine with 99.999% uptime.",
    category: "Case Decodes",
    readMinutes: 15,
    publishedAt: "2026-09-29",
    authorId: "alex-vance",
    highlight: true,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCtS-jO0SUqSd65S-JP_vASWciPdZ_ziano4ylgHbsjCWARLUPOATxEI7-J8OZbhL5GU5O3oAYve8Xm7SkOMZRNjPYEg4-IHIBKD3JjrD0tmTxCyMXwsrbQEd6ymwB_PuOkSvldUNrxfzygCtGCU3MKYfh97qFW99FaWV3Tl1pw9L3xcRcx_B5Pa6DfRMO4sef-54Xc6bZxBBHUsxvk7rtKlyX8uucb_sE9X3h8UY0wrW1z-POFY5N4w6d0CzYwXSQVFAlkkdLl9SHJ",
  },
  {
    id: "micro-animations",
    slug: "micro-animations-for-saas-conversion",
    title: "Micro-Animations for SaaS Conversion",
    excerpt:
      "Where motion earns its place in a product interface — and where it quietly costs you conversions.",
    category: "Design",
    readMinutes: 8,
    publishedAt: "2026-09-15",
    authorId: "marcus-thorne",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDd46JDJNa99u_FVjQx_-buHFGMsmlJxHclQ-VE1hWzx2cEuNLVLSzlrc63dLhrf_mGWpdpkV1VzxSyzzA8TlsGTrYsBzNv1MJNymMUyZVYc6OkaR910SHJ1BImfq3qX2H8t7JsatAgGbPTwntYFpeUpyCNMinUf0xV_ojC4Zq-bMd-oO-xaED28kSLyaWM9Debxh19NTELqq9C6Qzb4-jBoTVJHn2UWCcMlX5kfQSVloALdXMTEb6tf2kRCrjbhpt1bRlpQMlr90fo",
  },
];

/** Derived from the posts so no category can list zero articles. */
export const categories: Category[] = [...new Set(posts.map((p) => p.category))];

export const featuredPost = posts.find((p) => p.featured) ?? posts[0];
export const gridPosts = posts.filter((p) => !p.featured);
