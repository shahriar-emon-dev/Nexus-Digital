/**
 * Agency-level facts shown on the About page.
 *
 * `agencyPulse` is presented as live telemetry, so it is the first thing that
 * should become a real query — an API route reading build/commit/CSAT counts.
 * Keeping it here means swapping the source without touching the component.
 */
export type PulseStat = {
  id: string;
  /** Numeric value so the figure can animate; formatting lives in the component. */
  value: number;
  decimalPlaces?: number;
  suffix?: string;
  eyebrow: string;
  label: string;
  tone: "ink" | "brand" | "ion" | "orchid";
  /** Marks the live-operations readout, which gets the pulsing indicator. */
  live?: boolean;
};

/* TODO: replace with a live query — these are static placeholders. */
export const agencyPulse: PulseStat[] = [
  {
    id: "builds",
    value: 24,
    eyebrow: "Live Operations",
    label: "Active Global Builds",
    tone: "ink",
    live: true,
  },
  {
    id: "commits",
    value: 1420,
    eyebrow: "Dev Pipeline",
    label: "Commits This Month",
    tone: "ink",
  },
  {
    id: "csat",
    value: 4.9,
    decimalPlaces: 1,
    suffix: "/5.0",
    eyebrow: "Quality Index",
    label: "Average CSAT",
    tone: "ink",
  },
];

export type Milestone = {
  year: string;
  title: string;
  body: string;
  tone: "brand" | "ion" | "orchid";
  /** The current chapter — gets the travelling border beam. */
  current?: boolean;
};

export const milestones: Milestone[] = [
  {
    year: "2018",
    title: "Nexus Founded",
    body: "Established with a manifesto to bridge the gap between creative storytelling and hard-core systems engineering.",
    tone: "brand",
  },
  {
    year: "2020",
    title: "Global Enterprise Shift",
    body: "Onboarded our first Fortune 500 partner, transitioning into full-scale digital transformation for global industries.",
    tone: "ion",
  },
  {
    year: "2022",
    title: "Engineering Scale",
    body: "Scaled to 50+ specialized engineers across 6 timezones, implementing a true decentralized development model.",
    tone: "brand",
  },
  {
    year: "2024",
    title: "Obsidian AI Division",
    body: "Launched our dedicated AI laboratory, focusing on high-performance inference engines and custom LLM integrations.",
    tone: "orchid",
    current: true,
  },
];
