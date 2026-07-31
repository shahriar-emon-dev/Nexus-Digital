/**
 * The service catalogue.
 *
 * Shaped for the eventual `Service` / `ServiceSection` tables. Slugs match the
 * routes the public mega-menu already links to, so the admin list and the
 * marketing site describe the same catalogue rather than two parallel ones.
 * The long-form marketing copy still lives beside the public route in
 * `service-data.ts`; this module owns the record itself.
 */

export type ServiceCategory =
  | "Engineering"
  | "Design"
  | "Growth"
  | "Strategy"
  | "Infrastructure";

export type ServiceStatus = "Published" | "Draft" | "Archived";

export const serviceStatusTone: Record<ServiceStatus, "success" | "warning" | "default"> = {
  Published: "success",
  Draft: "warning",
  Archived: "default",
};

export type SectionKind =
  | "hero"
  | "overview"
  | "features"
  | "caseStudies"
  | "pricing"
  | "faq"
  | "cta";

export type SectionMeta = { kind: SectionKind; name: string; required?: boolean };

export const sectionCatalogue: SectionMeta[] = [
  { kind: "hero", name: "Hero section", required: true },
  { kind: "overview", name: "Service overview" },
  { kind: "features", name: "Features grid" },
  { kind: "caseStudies", name: "Case studies" },
  { kind: "pricing", name: "Pricing" },
  { kind: "faq", name: "FAQ" },
  { kind: "cta", name: "CTA banner" },
];

export const sectionMeta = (kind: SectionKind) =>
  sectionCatalogue.find((s) => s.kind === kind) ?? sectionCatalogue[0];

export type ServiceSection = {
  id: string;
  kind: SectionKind;
  /** How this instance is configured, shown under the name. */
  variant: string;
  visible: boolean;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  category: ServiceCategory;
  status: ServiceStatus;
  summary: string;
  /** Starting price in whole currency units. */
  fromPrice: number;
  /** Typical delivery window. */
  leadTimeWeeks: number;
  updatedAt: string;
  /** Live engagements running against this service. */
  activeProjects: number;
  sections: ServiceSection[];
};

export const services: Service[] = [
  {
    id: "web-development",
    slug: "web-development",
    name: "Next.js Development",
    category: "Engineering",
    status: "Published",
    summary:
      "High-performance, architecturally sound Next.js applications built for scale, speed and search.",
    fromPrice: 12_000,
    leadTimeWeeks: 8,
    updatedAt: "2026-07-30T09:12:00Z",
    activeProjects: 3,
    sections: [
      { id: "s1", kind: "hero", variant: "Full width · animated", visible: true },
      { id: "s2", kind: "overview", variant: "Two column · text and image", visible: true },
      { id: "s3", kind: "features", variant: "Three column · glass cards", visible: true },
      { id: "s4", kind: "caseStudies", variant: "Slider · dynamic", visible: true },
      { id: "s5", kind: "faq", variant: "Accordion · centred", visible: false },
      { id: "s6", kind: "cta", variant: "Centred · primary action", visible: true },
    ],
  },
  {
    id: "ux-ui-design",
    slug: "ux-ui-design",
    name: "UX & UI Design",
    category: "Design",
    status: "Published",
    summary:
      "Interface systems, motion language and design tokens that scale across every owned surface.",
    fromPrice: 9_500,
    leadTimeWeeks: 6,
    updatedAt: "2026-07-18T14:40:00Z",
    activeProjects: 2,
    sections: [
      { id: "s1", kind: "hero", variant: "Split · portfolio reel", visible: true },
      { id: "s2", kind: "features", variant: "Two column", visible: true },
      { id: "s3", kind: "caseStudies", variant: "Grid", visible: true },
      { id: "s4", kind: "cta", variant: "Inline", visible: true },
    ],
  },
  {
    id: "cloud-systems",
    slug: "cloud-systems",
    name: "Cloud Systems",
    category: "Infrastructure",
    status: "Published",
    summary:
      "Edge-first deployment, observability and cost control on AWS and Vercel.",
    fromPrice: 15_000,
    leadTimeWeeks: 10,
    updatedAt: "2026-06-22T11:05:00Z",
    activeProjects: 1,
    sections: [
      { id: "s1", kind: "hero", variant: "Compact · title only", visible: true },
      { id: "s2", kind: "overview", variant: "Single column", visible: true },
      { id: "s3", kind: "pricing", variant: "Tiered · retainer", visible: true },
      { id: "s4", kind: "cta", variant: "Full width band", visible: true },
    ],
  },
  {
    id: "data-analytics",
    slug: "data-analytics",
    name: "Data & Analytics",
    category: "Growth",
    status: "Published",
    summary:
      "First-party measurement, warehouse-native attribution and board-ready reporting.",
    fromPrice: 11_000,
    leadTimeWeeks: 7,
    updatedAt: "2026-05-30T16:20:00Z",
    activeProjects: 2,
    sections: [
      { id: "s1", kind: "hero", variant: "Full width", visible: true },
      { id: "s2", kind: "features", variant: "Three column", visible: true },
      { id: "s3", kind: "faq", variant: "Accordion", visible: true },
    ],
  },
  {
    id: "ai-machine-learning",
    slug: "ai-machine-learning",
    name: "AI & Machine Learning",
    category: "Engineering",
    status: "Draft",
    summary:
      "Applied models for search, personalisation and content operations — evaluated before they ship.",
    fromPrice: 18_000,
    leadTimeWeeks: 12,
    updatedAt: "2026-07-29T08:00:00Z",
    activeProjects: 0,
    sections: [
      { id: "s1", kind: "hero", variant: "Full width · animated", visible: true },
      { id: "s2", kind: "overview", variant: "Two column", visible: true },
    ],
  },
  {
    id: "brand-positioning",
    slug: "brand-positioning",
    name: "Brand Positioning",
    category: "Strategy",
    status: "Published",
    summary:
      "Territory mapping, narrative and the identity system that carries it.",
    fromPrice: 8_000,
    leadTimeWeeks: 5,
    updatedAt: "2026-04-11T10:30:00Z",
    activeProjects: 1,
    sections: [
      { id: "s1", kind: "hero", variant: "Editorial", visible: true },
      { id: "s2", kind: "caseStudies", variant: "Slider", visible: true },
      { id: "s3", kind: "cta", variant: "Centred", visible: true },
    ],
  },
  {
    id: "cybersecurity",
    slug: "cybersecurity",
    name: "Cybersecurity",
    category: "Infrastructure",
    status: "Draft",
    summary:
      "Threat modelling, dependency auditing and incident runbooks for product teams.",
    fromPrice: 14_000,
    leadTimeWeeks: 9,
    updatedAt: "2026-07-25T13:45:00Z",
    activeProjects: 0,
    sections: [{ id: "s1", kind: "hero", variant: "Compact", visible: true }],
  },
  {
    id: "mobile-apps",
    slug: "mobile-apps",
    name: "Mobile Applications",
    category: "Engineering",
    status: "Archived",
    summary: "Retired in favour of progressive web delivery under Next.js Development.",
    fromPrice: 16_000,
    leadTimeWeeks: 14,
    updatedAt: "2025-12-02T09:00:00Z",
    activeProjects: 0,
    sections: [{ id: "s1", kind: "hero", variant: "Compact", visible: true }],
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

export const serviceCategories: ServiceCategory[] = [
  ...new Set(services.map((s) => s.category)),
];

export const serviceStatuses: ServiceStatus[] = [
  ...new Set(services.map((s) => s.status)),
];

/** Derived — nothing on the list page is a typed-in count. */
export const serviceStats = {
  total: services.length,
  published: services.filter((s) => s.status === "Published").length,
  drafts: services.filter((s) => s.status === "Draft").length,
  activeProjects: services.reduce((sum, s) => sum + s.activeProjects, 0),
  fromPriceLow: Math.min(...services.map((s) => s.fromPrice)),
};

/** Duplicate targets — archived services are not sensible starting points. */
export const duplicatable = services.filter((s) => s.status !== "Archived");

// ── Creation wizard ─────────────────────────────────────────────────────────

export type StartingPoint = "blank" | "template" | "duplicate";

export type ServiceTemplate = {
  id: string;
  name: string;
  blurb: string;
  category: ServiceCategory;
  sections: SectionKind[];
};

export const serviceTemplates: ServiceTemplate[] = [
  {
    id: "engineering",
    name: "Engineering blueprint",
    blurb: "Technical delivery with architecture, sprints and a handover phase.",
    category: "Engineering",
    sections: ["hero", "overview", "features", "caseStudies", "cta"],
  },
  {
    id: "marketing",
    name: "Marketing blueprint",
    blurb: "Conversion-led with pricing and objection handling up front.",
    category: "Growth",
    sections: ["hero", "features", "pricing", "faq", "cta"],
  },
  {
    id: "strategy",
    name: "Strategy blueprint",
    blurb: "Editorial and evidence-led, weighted toward proof of work.",
    category: "Strategy",
    sections: ["hero", "overview", "caseStudies", "cta"],
  },
];

export const templateById = (id: string) => serviceTemplates.find((t) => t.id === id);

/** Slug rules, so the field and the validation message agree. */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** A slug already in use is the one error worth catching before submit. */
export const slugTaken = (slug: string) => services.some((s) => s.slug === slug);
