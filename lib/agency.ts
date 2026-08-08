/**
 * The agency's own history, for the About page timeline.
 *
 * This module used to also export `agencyPulse` — "24 Active Global Builds"
 * flagged as live telemetry, "1420 Commits This Month", "4.9 Average CSAT".
 * Nothing in this system records commits or satisfaction scores, and the pulsing
 * indicator implied a feed that did not exist. Those figures are gone; the
 * About page now shows the same derived stats as the homepage.
 *
 * What stays is genuine editorial copy about the company. Founding dates and a
 * team's own account of its direction are ordinary marketing writing — they are
 * claims the agency makes about itself, not measurements dressed up as data.
 *
 * One entry was reworded. It read "Onboarded our first Fortune 500 partner",
 * which is a checkable factual claim about a named client tier, and no client
 * record supports it. Anything here that asserts a specific client, revenue
 * figure or headcount needs a source before it goes back in.
 */

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
    title: "Enterprise Shift",
    body: "Moved from project work into full-scale digital transformation, taking on longer engagements with larger delivery teams.",
    tone: "ion",
  },
  {
    year: "2022",
    title: "Engineering Scale",
    body: "Adopted a distributed development model across multiple timezones, with delivery split into independent specialist pods.",
    tone: "brand",
  },
  {
    year: "2024",
    title: "AI Division",
    body: "Launched a dedicated AI practice, focusing on high-performance inference and custom model integration.",
    tone: "orchid",
    current: true,
  },
];
