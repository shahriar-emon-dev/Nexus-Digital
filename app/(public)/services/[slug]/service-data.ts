/**
 * Content for service detail pages, keyed by slug.
 *
 * Only slugs present here render the full detail template; anything else falls
 * back to the route scaffold, so every link in the header's mega-menu still
 * resolves rather than 404-ing while the remaining pages are written.
 */
export type ServiceDetail = {
  eyebrow: string;
  title: string;
  titleAccent: string;
  blurb: string;
  metrics: { label: string }[];
  price: string;
  availability: string;
  roadmap: { step: string; title: string; body: string; icon: RoadmapIcon }[];
  deliverables: { title: string; note: string; icon: DeliverableIcon }[];
  caseStudies: {
    tag: string;
    tone: "brand" | "orchid";
    title: string;
    result: string;
    image: string;
    href: string;
  }[];
  reviews: { quote: string; name: string; role: string }[];
};

export type RoadmapIcon = "audit" | "architecture" | "sprints" | "handover";
export type DeliverableIcon = "layers" | "bolt" | "support" | "dashboard";

export const services: Record<string, ServiceDetail> = {
  "web-development": {
    eyebrow: "Specialized",
    title: "Next.js",
    titleAccent: "Enterprise",
    blurb:
      "Elevate your digital presence with high-performance, architecturally sound Next.js applications. We build for scale, speed, and seamless user experiences using cutting-edge SSR and Edge capabilities.",
    metrics: [{ label: "<1s Page Load" }, { label: "99.9% Uptime" }],
    price: "$12,000",
    availability: "Q4 Slots Open",
    roadmap: [
      {
        step: "01",
        title: "Technical Audit",
        body: "Deep dive into current infrastructure, bottlenecks, and legacy dependencies.",
        icon: "audit",
      },
      {
        step: "02",
        title: "Architecture",
        body: "Defining Edge Functions, SSR strategies, and atomic component structure.",
        icon: "architecture",
      },
      {
        step: "03",
        title: "Agile Sprints",
        body: "Bi-weekly deployments with continuous testing and QA integration.",
        icon: "sprints",
      },
      {
        step: "04",
        title: "Handover",
        body: "Performance reports, technical documentation, and dev enablement.",
        icon: "handover",
      },
    ],
    deliverables: [
      { title: "Next.js Architecture", note: "Custom Turbopack setup", icon: "layers" },
      { title: "Vitals Optimization", note: "LCP / INP / CLS focus", icon: "bolt" },
      { title: "Dedicated Support", note: "24/7 technical on-call", icon: "support" },
      { title: "Edge Dashboard", note: "Real-time performance", icon: "dashboard" },
    ],
    caseStudies: [
      {
        tag: "Fintech",
        tone: "brand",
        title: "Zenith Capital Rebrand",
        result: "+340% User Growth",
        /* TODO: swap for a hosted asset — design-tool CDN URL, will expire. */
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuDbs8MmJfOYh4UbLurKaG5k4T3FNmXcFeDn5zQxXPus6EcbtGh5dP6jOP1TKinW3kq3cb_IVVh3Mc_hKQsuos6Y94mNrSCUyqsb6dWA1BW6WRlO8qMhgsp8VZhl-jvrEudYAcp9PkS-c302C8YJqpad7bc4vEfL3WZTMyZQre3Nfpj73eUgBlYZ3sl6zmL836BfkVre_Dasqou88kw6Ct2bzOqzgSf-sGrH7A0X0aR99ZtcokveB8MXam1b0h0qMa3sRP7dBpXoDfTC",
        href: "/case-studies",
      },
      {
        tag: "Luxury Retail",
        tone: "orchid",
        title: "Aura Luxury Platform",
        result: "2.5s TTI Improvement",
        /* TODO: swap for a hosted asset — design-tool CDN URL, will expire. */
        image:
          "https://lh3.googleusercontent.com/aida-public/AB6AXuCAMVxXuSilNTxLgfgFvuAvnqiWfk1GxpYCEyXO6wwNHxnHd8Zu1__JzYtmTnBgb0v3wfkqrtL2coYTtrHewY2eclJYp1EioOU0FLfAUPgvJG5xuEGqbr2lTCqK3-OnKpHLjmgAsixg4Ffk9OW8vaXTDYMh3lzbVKAStOhgJYu2cb2YAV-JHl86BiqUsI6j5eYMf4wbchmMpbDGmr10s7euC1yN-CzxqaW9-FjoiuowOWcZf1eRK-V65Klqe1LvNFf7SE_XShSfwyK6",
        href: "/case-studies",
      },
    ],
    reviews: [
      {
        quote:
          "The technical depth of the Nexus team is unparalleled. Our transition to Next.js reduced our server costs by 40% while doubling our speed.",
        name: "Marcus Sterling",
        role: "CTO, Zenith Fin",
      },
      {
        quote:
          "They don't just build websites; they engineer digital products. The Edge Analytics dashboard they provided gives us insights we never had before.",
        name: "Aria Laurent",
        role: "Product Lead, Aura",
      },
      {
        quote:
          "Nexus solved complex hydration issues that our previous agency couldn't touch. Truly masters of the Next.js ecosystem.",
        name: "James Donovan",
        role: "Engineering Dir, DataSync",
      },
    ],
  },
};
