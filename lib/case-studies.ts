/**
 * Shared project data. Two surfaces read from this and must not drift:
 *   /case-studies — the filterable archive
 *   /work         — the curated portfolio showcase
 */
export type Industry = "FinTech" | "E-Commerce" | "Web3 & AI" | "Enterprise";
export type Service =
  | "Digital Strategy"
  | "Web Dev"
  | "SEO Performance"
  | "UX Infrastructure";
export type Layout = "featured" | "stacked" | "split";

export type Metric = { value: string; label: string; tone: "brand" | "ion" };

export type Study = {
  id: string;
  title: string;
  /** Short form used by the showcase, where the full archive title is too long. */
  shortTitle: string;
  blurb: string;
  industry: Industry;
  service: Service;
  layout: Layout;
  featured?: boolean;
  image: string;
  href: string;
  metrics: Metric[];
};

/* TODO: every `image` is a design-tool CDN URL and will expire — swap for hosted assets. */
export const studies: Study[] = [
  {
    id: "astra",
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
    metrics: [
      { value: "+420%", label: "Conversion", tone: "brand" },
      { value: "0.4s", label: "Load Time", tone: "ion" },
    ],
  },
  {
    id: "vanguard",
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
