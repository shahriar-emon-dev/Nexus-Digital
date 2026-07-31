/**
 * Third-party credentials and global marketing tags.
 *
 * Shaped for the eventual `Integration` / `SiteSettings` tables.
 *
 * SECURITY: no secret value lives here, and none should ever reach the client.
 * A key is shown in full exactly once — at the moment it is created — and after
 * that only `last4` is ever sent to the browser. The source design pre-filled
 * its edit drawer with `sk_live_51Mxx…` and gave every row a reveal button,
 * which implies the server hands complete production secrets back on request.
 * Store a hash plus the last four, the way a card number is handled.
 */

export type Environment = "Production" | "Staging" | "Development";

export const environmentTone: Record<Environment, "brand" | "warning" | "default"> = {
  Production: "brand",
  Staging: "warning",
  Development: "default",
};

export type ProviderId = "stripe" | "openai" | "google" | "aws" | "resend";

export type Provider = {
  id: ProviderId;
  name: string;
  /** Prefix the provider itself uses, shown as a hint when adding a key. */
  keyPrefix: string;
  docs: string;
};

export const providers: Provider[] = [
  { id: "stripe", name: "Stripe", keyPrefix: "sk_live_", docs: "https://stripe.com/docs/keys" },
  { id: "openai", name: "OpenAI", keyPrefix: "sk-", docs: "https://platform.openai.com/api-keys" },
  { id: "google", name: "Google", keyPrefix: "AIza", docs: "https://developers.google.com" },
  { id: "aws", name: "AWS", keyPrefix: "AKIA", docs: "https://docs.aws.amazon.com/iam" },
  { id: "resend", name: "Resend", keyPrefix: "re_", docs: "https://resend.com/docs" },
];

export const providerById = (id: ProviderId) => providers.find((p) => p.id === id);

export type Integration = {
  id: string;
  providerId: ProviderId;
  label: string;
  environment: Environment;
  /** Only ever the final four characters. The rest never leaves the server. */
  last4: string;
  enabled: boolean;
  createdOn: string;
  lastUsedOn?: string;
  /** Keys older than this many days are flagged for rotation. */
  rotateAfterDays: number;
};

export const integrations: Integration[] = [
  {
    id: "int-1",
    providerId: "stripe",
    label: "Production gateway",
    environment: "Production",
    last4: "9A2f",
    enabled: true,
    createdOn: "2026-01-15",
    lastUsedOn: "2026-07-30",
    rotateAfterDays: 90,
  },
  {
    id: "int-2",
    providerId: "openai",
    label: "Chat assistant",
    environment: "Staging",
    last4: "fK3x",
    enabled: true,
    createdOn: "2026-05-02",
    lastUsedOn: "2026-07-29",
    rotateAfterDays: 180,
  },
  {
    id: "int-3",
    providerId: "google",
    label: "AdWords tracker",
    environment: "Production",
    last4: "w9zL",
    enabled: false,
    createdOn: "2025-11-20",
    lastUsedOn: "2026-03-11",
    rotateAfterDays: 365,
  },
  {
    id: "int-4",
    providerId: "resend",
    label: "Transactional email",
    environment: "Production",
    last4: "Qm71",
    enabled: true,
    createdOn: "2026-06-18",
    lastUsedOn: "2026-07-30",
    rotateAfterDays: 180,
  },
];

/** Masked form. Built here so no surface invents its own masking. */
export const maskedKey = (integration: Integration) => {
  const provider = providerById(integration.providerId);
  return `${provider?.keyPrefix ?? ""}••••••••${integration.last4}`;
};

export function ageInDays(iso: string, now = new Date()) {
  const then = new Date(`${iso}T00:00:00Z`).getTime();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.max(0, Math.round((today - then) / 86_400_000));
}

/** A key past its rotation window is the one thing this screen should shout about. */
export const needsRotation = (integration: Integration) =>
  ageInDays(integration.createdOn) > integration.rotateAfterDays;

export const environments: Environment[] = [
  ...new Set(integrations.map((i) => i.environment)),
];

export const integrationStats = {
  total: integrations.length,
  active: integrations.filter((i) => i.enabled).length,
  production: integrations.filter((i) => i.environment === "Production").length,
  stale: integrations.filter(needsRotation).length,
};

// ── Marketing tags ──────────────────────────────────────────────────────────

export type SiteSettings = {
  ga4MeasurementId: string;
  gtmContainerId: string;
  defaultTitle: string;
  metaDescription: string;
  ogImage: string;
  ogImageAlt: string;
  headerScripts: string;
  bodyStartScripts: string;
};

/* TODO: `ogImage` is a design-tool CDN URL and will expire. */
export const siteSettings: SiteSettings = {
  ga4MeasurementId: "G-7QK2M4XZ10",
  gtmContainerId: "GTM-NX9P4LQ",
  defaultTitle: "Nexus Digital Agency | Engineering-led brand and commerce",
  metaDescription:
    "We design and build the digital systems behind ambitious brands — commerce, content and measurement, engineered end to end.",
  ogImage:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuDQRriHjd7yrczvzL0_ndaZ37mDt6yeUVIaeC3aR1WY0G9mgPtZgRtJBwnlDz2KvPCdEazN9GxA7B3irWLTfNyHraJS9mRnOPpoSLOhZTDzeiuuel1yx45yNJ_VCRjbG03k_3NbFRv9YhyzDrt6YyZ0gzqat-tMldT0moeMTSdKTpbTTTIUJ8GMRNASQUrNDGWKVuMOZDHoZiRlp1uITPR4LGhWil2Q3Qcs6cMZARkZABTdWOUqPhDlNQ",
  ogImageAlt: "Nexus wordmark over a dark field of layered jade and ion light.",
  headerScripts: "",
  bodyStartScripts: "",
};

/** Recommended lengths, so the counters mean something. */
export const SEO_LIMITS = {
  title: 60,
  description: 155,
} as const;

/** Shape of an identifier, used to tell the user why a value was rejected. */
export const idPatterns = {
  ga4: { pattern: "^G-[A-Z0-9]{6,12}$", hint: "Starts with G- followed by 6–12 characters." },
  gtm: { pattern: "^GTM-[A-Z0-9]{5,9}$", hint: "Starts with GTM- followed by 5–9 characters." },
} as const;
