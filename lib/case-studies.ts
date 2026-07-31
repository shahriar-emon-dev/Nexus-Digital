/**
 * Shared project data — the single source of truth for every surface that shows
 * a case study:
 *   /case-studies        — the filterable archive
 *   /case-studies/[slug] — the long-form detail page
 *
 * Shaped to match the eventual database table (id, slug, relations) rather than
 * any one page's layout, so wiring this to Prisma later is a swap of the export,
 * not a rewrite of the pages.
 */
export type Industry = "FinTech" | "E-Commerce" | "Web3 & AI" | "Enterprise";
export type Service =
  | "Digital Strategy"
  | "Web Dev"
  | "SEO Performance"
  | "UX Infrastructure";
export type Layout = "featured" | "stacked" | "split";

export type Metric = { value: string; label: string; tone: "brand" | "ion" | "orchid" };

/** Long-form content for `/case-studies/[slug]`. Absent until it is written. */
export type StudyDetail = {
  discipline: string;
  headline: string;
  /** Authoritative figures. The archive card shows the first two. */
  heroMetrics: Metric[];
  challenge: { heading: string; body: string; points: string[]; image: string };
  comparison: { before: string; after: string };
  solution: {
    heading: string;
    body: string;
    pillars: { title: string; body: string }[];
  };
  execution: { heading: string; body: string; stack: string[] };
  testimonial: { quote: string; name: string; role: string; portrait: string };
  servicesDeployed: string[];
};

export type Study = {
  id: string;
  slug: string;
  title: string;
  /** Short form used where the full archive title is too long. */
  shortTitle: string;
  blurb: string;
  industry: Industry;
  service: Service;
  layout: Layout;
  featured?: boolean;
  image: string;
  href: string;
  metrics: Metric[];
  detail?: StudyDetail;
};

/* TODO: every `image` is a design-tool CDN URL and will expire — swap for hosted assets. */
export const studies: Study[] = [
  {
    id: "astra",
    slug: "astra-banking",
    title: "Astra Banking: Scaling Neobank Architecture",
    shortTitle: "Astra Banking",
    blurb:
      "Architecting a high-availability microservices ecosystem for the next generation of digital finance. We overhauled the legacy latency by 85% while implementing military-grade encryption protocols.",
    industry: "FinTech",
    service: "Web Dev",
    layout: "featured",
    featured: true,
    href: "/case-studies/astra-banking",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBPMo6lCzo-z0IsGv1Ez0RRN6qCQSO0fVoPGSQVLUkxS_boV1uAGZLzt1wxAVyNk1zqV3z-nw_6aoMG9jIaS_W9Y9HgsgvpOCdWthdk_3WA8I2mv7eL_2ptNXmtjfYtdsgUUTR1cJlu0RR1wMqQbu3125Ohvs0_LOKI4bhackHgiEy_5QZHLRauFxWER2_HLZW-12dg_iS4Kg3olZH__EQJUamfHRmZznbWmttRZvRChaMSe5nhsdtWpr3LNV_Eug9wQbcnAOHe6Y03",
    // Aligned with `detail.heroMetrics` below so the card and the detail page
    // never quote different numbers for the same client.
    metrics: [
      { value: "420%", label: "Throughput Increase", tone: "brand" },
      { value: "12ms", label: "Average Latency", tone: "ion" },
    ],
    detail: {
      discipline: "Fintech Architecture",
      headline: "Astra Banking: Re-engineering Global Liquidity",
      heroMetrics: [
        { value: "420%", label: "Throughput Increase", tone: "brand" },
        { value: "12ms", label: "Average Latency", tone: "ion" },
        { value: "$2.4B", label: "Volume Processed", tone: "orchid" },
      ],
      challenge: {
        heading: "A Legacy of Fragmentation",
        body: "Astra was hampered by a monolithic infrastructure that struggled with cross-border synchronization and peak-load volatility. The existing stack suffered from recurring downtime during high-volume trading windows, resulting in significant slippage and user attrition.",
        points: [
          "Outdated transactional logic causing 4s+ execution delays.",
          "Inefficient database sharding leading to data inconsistency.",
          "Security vulnerabilities in the middleware layer.",
        ],
        /* TODO: design-tool CDN URL — will expire. */
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuC6VkUGX0mZgxyaaVhtS5tz4eBFhO6j8JmKXNtLV-yCKDT71p13jJYaxqY8Bm9Ep6yN_AkMSFHUWN7VYrEEQ7EzwPzm9vw7_k2F6fQ9apo3UxIjR3_ORHM3fMYILgY6BF7JGLzyqgTfgPXb25a02JABOz-Lr_sAUyFAVaudUZnQtqSmyEB4aNxJUAKHmo5NNs8tUm9ISqCoN1oNgDn4bfnNCzFR97NcTYeDQGNYD4UF7vhDGUJHKgAk-86z3AhHeV7h-J_tKiBONYAq",
      },
      comparison: {
        /* TODO: design-tool CDN URLs — will expire. */
        before:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDPaRC-5VLlAEQ1dv6e32x3iks0YZisMStIvpa1gJJbMDz45vXZre9yw-KUe1Jvh5CgXEBRjQG3-LMgCydYRkB16kwZjFcjl42kuCgH16a41nEoRGAoUNrwo7sHIUBdIuOAyKbl-q0DbXx72p9v4wFRh9ETRG0vtxPQ2uffxConV_ttFO_Cekz3r4jaYk2y-_mkXHMHz3iXZEZaw2y5ohwidOLGkn6xv0wABkvj0CY4m6kEPv21yFu7Ziro-CqBvNG4hjnVhjViM6yg",
        after:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCb2CVZIHaX8FS7lfqRUi1h-jgrXRCUBN6vWrbUy_SiIn8XhZQoWsyWSGmB0BphJwhZQb_xqZbQJUD7TjT4w6cFRi6E4e_E9FUhlE3ecaSQIjDlGt14R2U3D49NhoaYhGgalbpgs2xWC0swPoZJQdQjR5REPa9FupbFSVwxpCfpwdlQYkBn7LlkhCSZiZ09PGy_-H-yvJbmLsdRXMhXbyasggJluV8vurPF13hm6t5JejTno5nLXPj4kkOdK9eqBqoOIGzlLNmvEIvm",
      },
      solution: {
        heading: "Cloud-Native Transformation",
        body: "We architected a distributed ledger solution utilizing a multi-region Kubernetes cluster, ensuring 99.999% availability. By decoupling the core engine from the presentation layer, we achieved unprecedented agility in feature deployment.",
        pillars: [
          {
            title: "Microservices",
            body: "Independent scaling of high-demand modules.",
          },
          {
            title: "Zero-Trust",
            body: "End-to-end encryption for every data packet.",
          },
        ],
      },
      execution: {
        heading: "Engineering the Stack",
        body: "The execution involved a 6-month rapid-sprint cycle, migrating 12TB of legacy data without a single millisecond of scheduled downtime. We utilized Rust for the core execution engine to maximize performance and memory safety.",
        stack: ["Rust", "Go-Lang", "PostgreSQL", "Kafka", "Docker"],
      },
      testimonial: {
        quote:
          "Nexus didn't just build a new platform; they redefined our entire business model. Our technical debt was holding us back from market dominance — they cleared the path in record time.",
        name: "Marcus Sterling",
        role: "Founder & CEO, Astra Banking",
        /* TODO: design-tool CDN URL — will expire. */
        portrait:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCoIJUjl5wJCL4X2ZHx6cpUow-dZUPot0wS93L8SUy2vl7aVC4RG3yCTIbdbZ091H2wAR9L-c-sVJJhyTAhqGCj84OMC-C_KCWB5Ph7wAyGDCKMDY7Y6dMqJna6r86eHIsnds94g8FIMSRraU9MC6aS5-5mjm-4q7W9N1Uvrqrd6BVqbWkCoeds-r0ilw-pj3a5EonrwXOWTu-CuMx1jv85C259esV8agfez8srrZTZxGkQsxQJnOKzp4kWPCukc1WmWxvnAHmEmHoh",
      },
      servicesDeployed: [
        "System Architecture",
        "Cloud Migration",
        "DevSecOps",
        "UI/UX Strategy",
      ],
    },
  },
  {
    id: "vanguard",
    slug: "vanguard-retail",
    title: "Vanguard Retail",
    shortTitle: "Vanguard Retail",
    blurb: "Deploying headless commerce solutions for a global fashion conglomerate.",
    industry: "E-Commerce",
    service: "Web Dev",
    layout: "stacked",
    href: "/case-studies/vanguard-retail",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDs7spcOpYYKgINtrycy2dEJF8scuoUkS-ng3fUHH57_VsKQ8DURITSXr_5ZbdJ_OIL0GKBqEKIA0iEl9IL9hJETekS6XILZY9WB80tSYBwHRblpoGaZ0FGsVPOc6DTrJNMWp4o9M0gzZ2u-_Ha5638yuguWP59_1eGy_4EqoQN7MPZuovrHG4d7k3u8MQDmI6CQ1-xZ0G-5xBVVpFsgAhUspyppK23pZE62rxhcTnO68pEguGxnJXJiPRZWNPI66EJsqKY58pkoJcc",
    metrics: [{ value: "+120% YoY", label: "Revenue", tone: "ion" }],
  },
  {
    id: "lumina",
    slug: "lumina-ai",
    title: "Lumina AI Suite",
    shortTitle: "Lumina AI Suite",
    blurb:
      "Engineering an AI-driven logistics platform that optimized supply chain routing for Fortune 500 partners.",
    industry: "Enterprise",
    service: "Digital Strategy",
    layout: "split",
    href: "/case-studies/lumina-ai",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuACZ0Lqm3OAlzJka9Wn-A-CBAAkEVeQ0fLlIyXzOOR2Iv8-ZSnlBRacddLyIzr-d_T6Pule9RMBkfJ5N9AyO5OYykU-GhfDF6t1VYbEJ-NDB_GnCOx5c-sHoKpqBCk4uJX0Tyd1t_HoZXlBbrnmNBZ1L_9QUe_GuxbU-oPc8UOD8hB82oF6SZx4oTtC8J1QFAfcsDuxVqUc-bx8wLKeLQakv1BzKFdPUWmNU2KCLXt6_p2z8p_yFjIuIpD2Q7bOnUExJ6amLSnwhDx0",
    metrics: [
      { value: "99.99%", label: "Uptime", tone: "brand" },
      { value: "−30%", label: "OpEx Reduction", tone: "ion" },
    ],
  },
  {
    id: "ethernode",
    slug: "ethernode-portal",
    title: "EtherNode Portal",
    shortTitle: "EtherNode Portal",
    blurb:
      "Decentralized dashboard development focusing on user-centric node management and staking visualization.",
    industry: "Web3 & AI",
    service: "UX Infrastructure",
    layout: "split",
    href: "/case-studies/ethernode-portal",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAv2BvYsKIVg9tJoOwQHOHPjrb3IgcHNtdyV_9ZsEHK-hTCNogphnRBZlvh7M4-PEFpcYFeJ4W1HAHl4yAunD9wEupPkHaMmrnt8DhxfD7qoYNE3PfkkiCeGhvY2dcIwKDz0pEaB2FOE6YbBXU1bOlWnXe_J0kD_095zclIr0W2QwBrAeT-hDk0TAfx4rk6UgYgZEgqVuuzgEevFl8IXSkSN3ZmrEJ4DS-_1tN0txJRjWGJ8yTQ1D91VdDDjHXuM_7FCM3VLFfo6YM9",
    metrics: [
      { value: "$2.4B", label: "TVL Managed", tone: "brand" },
      { value: "250k+", label: "Active Nodes", tone: "ion" },
    ],
  },
];

export const industries: (Industry | "All Sectors")[] = [
  "All Sectors",
  "FinTech",
  "E-Commerce",
  "Web3 & AI",
  "Enterprise",
];

export const serviceFilters: (Service | "All Services")[] = [
  "All Services",
  "Digital Strategy",
  "Web Dev",
  "SEO Performance",
  "UX Infrastructure",
];
