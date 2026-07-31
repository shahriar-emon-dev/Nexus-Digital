/**
 * Landing pages managed through the CMS.
 *
 * Shaped for the eventual `Page` / `PageBlock` / `PageTemplate` tables. The
 * builder reads and reorders `blocks`; the canvas renders the same array, so a
 * block cannot appear in the outline without appearing in the preview.
 */

export type PageEnvironment = "Staging" | "Production";

export type PageStatus = "Draft" | "Scheduled" | "Live" | "Archived";

export const pageStatusTone: Record<PageStatus, "default" | "warning" | "success" | "info"> = {
  Draft: "default",
  Scheduled: "warning",
  Live: "success",
  Archived: "info",
};

/** The five archetypes offered by the creation wizard. */
export type PageTypeId = "standard" | "dynamic" | "marketing" | "product" | "variant";

export type PageType = {
  id: PageTypeId;
  name: string;
  blurb: string;
  icon: "article" | "sparkle" | "megaphone" | "package" | "split";
  /** Blocks a new page of this type starts with. */
  starterBlocks: BlockKind[];
  recommended?: boolean;
};

export const pageTypes: PageType[] = [
  {
    id: "standard",
    name: "Standard",
    blurb: "Classic layout for articles, information and simple content.",
    icon: "article",
    starterBlocks: ["hero", "richText"],
  },
  {
    id: "dynamic",
    name: "Dynamic LP",
    blurb: "Content that adapts to the campaign or audience that arrived.",
    icon: "sparkle",
    starterBlocks: ["hero", "featureGrid", "cta"],
  },
  {
    id: "marketing",
    name: "Marketing",
    blurb: "High-conversion asset with a single focused call to action.",
    icon: "megaphone",
    starterBlocks: ["hero", "featureGrid", "pricing", "faq", "cta"],
    recommended: true,
  },
  {
    id: "product",
    name: "Product LP",
    blurb: "Detailed showcase with specifications and comparison.",
    icon: "package",
    starterBlocks: ["hero", "featureGrid", "pricing"],
  },
  {
    id: "variant",
    name: "A/B variant",
    blurb: "Clone an existing page and change one thing to test it.",
    icon: "split",
    starterBlocks: [],
  },
];

export const pageTypeById = (id: PageTypeId) => pageTypes.find((t) => t.id === id);

// ── Blocks ──────────────────────────────────────────────────────────────────

export type BlockKind =
  | "hero"
  | "featureGrid"
  | "pricing"
  | "faq"
  | "richText"
  | "testimonials"
  | "cta";

export type BlockMeta = {
  kind: BlockKind;
  name: string;
  /** Some blocks cannot be removed — a page without a hero has no entry point. */
  required?: boolean;
};

export const blockCatalogue: BlockMeta[] = [
  { kind: "hero", name: "Hero section", required: true },
  { kind: "featureGrid", name: "Feature grid" },
  { kind: "pricing", name: "Pricing tables" },
  { kind: "faq", name: "FAQ section" },
  { kind: "richText", name: "Rich text" },
  { kind: "testimonials", name: "Testimonials" },
  { kind: "cta", name: "Closing call to action" },
];

export const blockMeta = (kind: BlockKind) =>
  blockCatalogue.find((b) => b.kind === kind) ?? blockCatalogue[0];

export type PageBlock = {
  id: string;
  kind: BlockKind;
  /** Short description of how this instance is configured. */
  variant: string;
  visible: boolean;
  /** Part of a running experiment. */
  experiment?: string;
};

export type LandingPage = {
  id: string;
  title: string;
  slug: string;
  typeId: PageTypeId;
  status: PageStatus;
  environment: PageEnvironment;
  updatedAt: string;
  blocks: PageBlock[];
  /** Menu placement. `parent` is null when the page sits at the root. */
  nav: {
    inMainNav: boolean;
    parent: string | null;
    label: string;
  };
};

export const navParents = ["Root level", "Company > Promotions", "Solutions", "Resources"];

export const landingPages: LandingPage[] = [
  {
    id: "summer-sale",
    title: "Summer Solstice Sale",
    slug: "promo/summer-sale",
    typeId: "marketing",
    status: "Draft",
    environment: "Staging",
    updatedAt: "2026-07-31T09:20:00Z",
    nav: { inMainNav: true, parent: "Company > Promotions", label: "Summer Sale" },
    blocks: [
      { id: "b1", kind: "hero", variant: "Centred, primary call to action", visible: true },
      { id: "b2", kind: "featureGrid", variant: "Two columns, icon led", visible: true },
      {
        id: "b3",
        kind: "pricing",
        variant: "Tiered, monthly and annual",
        visible: true,
        experiment: "Price anchor A/B",
      },
      { id: "b4", kind: "faq", variant: "Accordion, searchable", visible: false },
    ],
  },
  {
    id: "engine-launch",
    title: "Nexus Engine v4 Launch",
    slug: "launch/engine-v4",
    typeId: "product",
    status: "Live",
    environment: "Production",
    updatedAt: "2026-07-24T16:05:00Z",
    nav: { inMainNav: false, parent: null, label: "Engine v4" },
    blocks: [
      { id: "b1", kind: "hero", variant: "Split, product render", visible: true },
      { id: "b2", kind: "featureGrid", variant: "Three columns", visible: true },
      { id: "b3", kind: "testimonials", variant: "Carousel", visible: true },
      { id: "b4", kind: "cta", variant: "Full width band", visible: true },
    ],
  },
  {
    id: "commerce-guide",
    title: "Headless Commerce Guide",
    slug: "resources/headless-commerce",
    typeId: "standard",
    status: "Live",
    environment: "Production",
    updatedAt: "2026-06-30T11:40:00Z",
    nav: { inMainNav: true, parent: "Resources", label: "Commerce guide" },
    blocks: [
      { id: "b1", kind: "hero", variant: "Compact, title only", visible: true },
      { id: "b2", kind: "richText", variant: "Long form, two column", visible: true },
      { id: "b3", kind: "cta", variant: "Inline, newsletter", visible: true },
    ],
  },
  {
    id: "q3-webinar",
    title: "Q3 Performance Webinar",
    slug: "events/q3-webinar",
    typeId: "dynamic",
    status: "Scheduled",
    environment: "Staging",
    updatedAt: "2026-07-29T08:15:00Z",
    nav: { inMainNav: false, parent: null, label: "Q3 webinar" },
    blocks: [
      { id: "b1", kind: "hero", variant: "Countdown, registration form", visible: true },
      { id: "b2", kind: "faq", variant: "Accordion", visible: true },
    ],
  },
];

export const pageById = (id: string) => landingPages.find((p) => p.id === id);

/** Header count. Derived — the design hardcoded "14 Pages Live". */
export const pageStats = {
  total: landingPages.length,
  live: landingPages.filter((p) => p.status === "Live").length,
  drafts: landingPages.filter((p) => p.status === "Draft").length,
  inMainNav: landingPages.filter((p) => p.nav.inMainNav).length,
};

// ── Templates ───────────────────────────────────────────────────────────────

export type TemplateCategory = "SaaS" | "B2B" | "E-com" | "Marketing";

export type PageTemplate = {
  id: string;
  name: string;
  category: TemplateCategory;
  tag: string;
  /** How many pages have been started from it. */
  uses: number;
  image: string;
  alt: string;
  /** Types this template is a sensible starting point for. */
  suits: PageTypeId[];
};

/* TODO: every `image` is a design-tool CDN URL and will expire. */
export const templates: PageTemplate[] = [
  {
    id: "saas-v4",
    name: "SaaS Landing v4",
    category: "SaaS",
    tag: "SaaS hero",
    uses: 1_200,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCjelAAFyTctqbDneoSGT09db_-8idR52PAWiQC-wz7RDQRkOZ2AFdABp8uvG9OTvXMhSJdHv4OylvEk-Y_ESnVQs7ih6sz00j8DWSirN08XSSeb3FjfYnEB3cFMuD5degM9xrHSBgBFoonkBM_jQV-UvGZLqIvfwIwrUOHuLe3GpOKRRVEo8xcHI1-w7tZUq3e2JXg1mCiHZjSMsPbpb7l91f7G-4-5yIjrpwX-8uByomESSPzJKJDQA",
    alt: "Dark SaaS landing page with glass data cards and a jade primary action.",
    suits: ["marketing", "dynamic", "standard"],
  },
  {
    id: "product-launch",
    name: "Product Launch Pro",
    category: "E-com",
    tag: "Hardware",
    uses: 850,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDnu5p8sGEuabOKL1DHSAlsNGrfsTNwgrTFyY60za9Sa2xlV8yFgKbVKW0yqMOXyUQah5V8U24SMl0kpqP-J6vUM7Llzr4SYxyfLNKgTJLFU2aUG_uMRjtxWbIBtZ_IiEvNIFCDmxzOQXe1RBdkgkNkQjK_uYh2Dpo_dlXidamhHyegKhBnfWPLKO7AHnF5Qc-oE0PXhSDpzSPCQ8qLSAszJ819oqjIRkRZsGU8zDczPwzIGYeR90naeA",
    alt: "Product launch page centred on a hardware render with floating callouts.",
    suits: ["product", "marketing"],
  },
  {
    id: "pricing-master",
    name: "Pricing Page Master",
    category: "B2B",
    tag: "Growth",
    uses: 3_400,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCzHHQW7b0ZRrXllAwLW-zC9MwSU1wG1Hcye31MWCy7MfJQdIfcSP0baRzQFU5jJgKG0gJAg23oxGIlGG9ebTNcmOpsSQKMiMcN2VUZypfXge9LV6wTE6_0jN_1quNSsAfVtENf6nrZolrHgFQoPO_5J9pmzQCaOB3y86Gq72J7li_3bWUq95icfehWhZVEXAJZmKTYzXW8RoSyjGbK1s7ov4lHJRmPlj984Y95nIzP4yFGYVlw08WFsw",
    alt: "Three-tier pricing table with the middle tier highlighted.",
    suits: ["marketing", "product", "standard"],
  },
  {
    id: "conversion-funnel",
    name: "Conversion Funnel A",
    category: "Marketing",
    tag: "Lead gen",
    uses: 2_100,
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD9ibSjJuqLvb6vzDhYIzr0fOoeol-EEHTyXO2ihLdNjCZIMA9Q6MRMFAYNoWxfCGFILtC0v3g-Q3a2OxB3GRPSxGkqe2jGdApq72xmfoBVuLtDTNF5S25hRUC0gQ4ObaePmbiUfsi-iF1B25BpreKBkKNZiNWzcIw1JQ-noXJZwTiBXygujEYt3Yiid7yoN00fmeYoFG0XvUYzatIs3RIq2nC2EFnAGOiN2JQtXzMAfmgSXz6Hk_bTJw",
    alt: "Split lead-generation layout with artwork beside a focused form.",
    suits: ["marketing", "dynamic"],
  },
  {
    id: "blank",
    name: "Blank canvas",
    category: "B2B",
    tag: "Empty",
    uses: 420,
    image: "",
    alt: "",
    suits: ["standard", "dynamic", "marketing", "product", "variant"],
  },
];

export const templateCategories: TemplateCategory[] = [
  ...new Set(templates.map((t) => t.category)),
];

/** Only templates that suit the chosen type — the filter is the point. */
export const templatesFor = (typeId: PageTypeId) =>
  templates.filter((t) => t.suits.includes(typeId));

export const templateById = (id: string) => templates.find((t) => t.id === id);
