/**
 * Search performance data behind the admin analytics screens.
 *
 * Shaped for the eventual `SeoProperty` / `SeoDaily` / `Keyword` tables. Every
 * chart path and KPI on the page is computed from these series rather than
 * drawn by hand — the source designs used decorative SVG curves that had no
 * relationship to the numbers printed beside them.
 */

export type SeoProperty = {
  id: string;
  domain: string;
  label: string;
};

export const seoProperties: SeoProperty[] = [
  { id: "nexus-studio", domain: "nexus.studio", label: "Nexus Studio (primary)" },
  { id: "nexus-agency", domain: "nexus.agency", label: "Nexus Agency (marketing)" },
  { id: "northwind", domain: "northwindretail.com", label: "Northwind Retail (client)" },
];

export type DateRange = { id: string; label: string; days: number };

export const dateRanges: DateRange[] = [
  { id: "7d", label: "Last 7 days", days: 7 },
  { id: "30d", label: "Last 30 days", days: 30 },
  { id: "90d", label: "Last 90 days", days: 90 },
];

/** One row per day. `position` is an average rank, so lower is better. */
export type SeoDay = {
  date: string;
  clicks: number;
  impressions: number;
  position: number;
};

/**
 * 30 days of search console style data. Deterministic rather than random so a
 * rebuild does not silently change every figure on the page.
 */
export const seoDaily: SeoDay[] = (() => {
  const start = new Date("2026-07-01T00:00:00Z");
  const days: SeoDay[] = [];
  for (let i = 0; i < 30; i += 1) {
    const date = new Date(start.getTime() + i * 86_400_000);
    // A gentle upward trend with a weekly dip, so the shape is legible.
    const weekly = Math.sin((i / 7) * Math.PI * 2) * 0.12;
    const trend = i / 29;
    const impressions = Math.round(62_000 + trend * 34_000 + weekly * 11_000);
    const clicks = Math.round(impressions * (0.031 + trend * 0.011 + weekly * 0.003));
    const position = Number((16.4 - trend * 2.7 + weekly * 0.9).toFixed(1));
    days.push({
      date: date.toISOString().slice(0, 10),
      clicks,
      impressions,
      position,
    });
  }
  return days;
})();

const sum = (ns: number[]) => ns.reduce((a, b) => a + b, 0);
const avg = (ns: number[]) => (ns.length === 0 ? 0 : sum(ns) / ns.length);

/** Splits the window in half to compare like with like. */
function periodOverPeriod<T>(rows: T[], value: (row: T) => number) {
  const half = Math.floor(rows.length / 2);
  const previous = avg(rows.slice(0, half).map(value));
  const current = avg(rows.slice(half).map(value));
  const delta = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  return { current, previous, delta };
}

export type SeoKpi = {
  id: string;
  label: string;
  value: string;
  /** Percent change, already signed. */
  delta: number;
  /** Whether a rise is good — average position improves as it falls. */
  higherIsBetter: boolean;
  series: number[];
  tone: "brand" | "ion";
};

const impressionsPop = periodOverPeriod(seoDaily, (d) => d.impressions);
const clicksPop = periodOverPeriod(seoDaily, (d) => d.clicks);
const positionPop = periodOverPeriod(seoDaily, (d) => d.position);
const ctrPop = periodOverPeriod(seoDaily, (d) => (d.clicks / d.impressions) * 100);

export const totals = {
  impressions: sum(seoDaily.map((d) => d.impressions)),
  clicks: sum(seoDaily.map((d) => d.clicks)),
  avgPosition: avg(seoDaily.map((d) => d.position)),
  ctr: (sum(seoDaily.map((d) => d.clicks)) / sum(seoDaily.map((d) => d.impressions))) * 100,
};

const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

/** Core Web Vitals, reported separately from the search series. */
export const coreWebVitals = {
  score: 94,
  passing: true,
  metrics: [
    { id: "lcp", label: "LCP", value: "1.9s", budget: "2.5s", pass: true },
    { id: "inp", label: "INP", value: "142ms", budget: "200ms", pass: true },
    { id: "cls", label: "CLS", value: "0.04", budget: "0.1", pass: true },
  ],
};

export const seoKpis: SeoKpi[] = [
  {
    id: "impressions",
    label: "Total impressions",
    value: compact.format(totals.impressions),
    delta: impressionsPop.delta,
    higherIsBetter: true,
    series: seoDaily.map((d) => d.impressions),
    tone: "ion",
  },
  {
    id: "clicks",
    label: "Total clicks",
    value: compact.format(totals.clicks),
    delta: clicksPop.delta,
    higherIsBetter: true,
    series: seoDaily.map((d) => d.clicks),
    tone: "brand",
  },
  {
    id: "position",
    label: "Average position",
    value: totals.avgPosition.toFixed(1),
    delta: positionPop.delta,
    // A falling average position is an improvement, so the arrow and the colour
    // have to be decided from this rather than from the sign of the delta.
    higherIsBetter: false,
    series: seoDaily.map((d) => d.position),
    tone: "brand",
  },
  {
    id: "ctr",
    label: "Organic CTR",
    value: `${totals.ctr.toFixed(2)}%`,
    delta: ctrPop.delta,
    higherIsBetter: true,
    series: seoDaily.map((d) => (d.clicks / d.impressions) * 100),
    tone: "ion",
  },
];

// ── Keywords ────────────────────────────────────────────────────────────────

export type KeywordIntent = "Informational" | "Commercial" | "Transactional";

export const intentTone: Record<KeywordIntent, "brand" | "ion" | "default"> = {
  Informational: "brand",
  Commercial: "ion",
  Transactional: "default",
};

export type Keyword = {
  id: string;
  term: string;
  url: string;
  intent: KeywordIntent;
  volume: number;
  /** Keyword difficulty, 0–100. */
  difficulty: number;
  position: number;
  /** Places gained since the previous period; negative is a fall. */
  change: number;
  /** The one currently under review, highlighted in the table. */
  focus?: boolean;
};

export const keywords: Keyword[] = [
  {
    id: "k1",
    term: "enterprise seo automation",
    url: "/solutions",
    intent: "Commercial",
    volume: 12_400,
    difficulty: 82,
    position: 3,
    change: 2,
    focus: true,
  },
  {
    id: "k2",
    term: "ai content intelligence",
    url: "/blog/ai",
    intent: "Informational",
    volume: 4_100,
    difficulty: 45,
    position: 14,
    change: -3,
  },
  {
    id: "k3",
    term: "obsidian engine pricing",
    url: "/pricing",
    intent: "Transactional",
    volume: 1_200,
    difficulty: 22,
    position: 1,
    change: 0,
  },
  {
    id: "k4",
    term: "real-time serp tracker",
    url: "/features/tracking",
    intent: "Commercial",
    volume: 8_900,
    difficulty: 71,
    position: 22,
    change: 12,
  },
  {
    id: "k5",
    term: "best agency seo software",
    url: "/reviews",
    intent: "Commercial",
    volume: 15_500,
    difficulty: 94,
    position: 45,
    change: -5,
  },
  {
    id: "k6",
    term: "headless commerce migration",
    url: "/services/commerce",
    intent: "Commercial",
    volume: 6_300,
    difficulty: 58,
    position: 8,
    change: 4,
  },
  {
    id: "k7",
    term: "what is technical seo",
    url: "/blog/technical-seo",
    intent: "Informational",
    volume: 27_000,
    difficulty: 38,
    position: 6,
    change: 1,
  },
  {
    id: "k8",
    term: "book an seo audit",
    url: "/contact",
    intent: "Transactional",
    volume: 880,
    difficulty: 15,
    position: 2,
    change: 0,
  },
  {
    id: "k9",
    term: "design system consultancy",
    url: "/services/design",
    intent: "Commercial",
    volume: 3_400,
    difficulty: 49,
    position: 11,
    change: -2,
  },
  {
    id: "k10",
    term: "core web vitals checklist",
    url: "/blog/core-web-vitals",
    intent: "Informational",
    volume: 9_700,
    difficulty: 29,
    position: 4,
    change: 6,
  },
];

/** Difficulty banding, so the bar colour and the filter agree on the cutoffs. */
export const difficultyBands = [
  { id: "easy", label: "Easy (0–30)", min: 0, max: 30, tone: "success" },
  { id: "medium", label: "Medium (31–60)", min: 31, max: 60, tone: "warning" },
  { id: "hard", label: "Hard (61+)", min: 61, max: 100, tone: "danger" },
] as const;

export const bandFor = (difficulty: number) =>
  difficultyBands.find((b) => difficulty >= b.min && difficulty <= b.max) ??
  difficultyBands[2];

export const volumeBands = [
  { id: "high", label: "10k and above", min: 10_000, max: Infinity },
  { id: "mid", label: "1k – 10k", min: 1_000, max: 9_999 },
  { id: "low", label: "Under 1k", min: 0, max: 999 },
] as const;

export const keywordIntents: KeywordIntent[] = [
  ...new Set(keywords.map((k) => k.intent)),
];

/** Table header count. Derived — the design hardcoded "Active Assets: 142". */
export const trackedKeywordCount = keywords.length;

export const topKeywords = [...keywords]
  .sort((a, b) => a.position - b.position)
  .slice(0, 5);

// ── Devices and health ──────────────────────────────────────────────────────

export const deviceSplit = [
  { id: "mobile", label: "Mobile", share: 65, tone: "ion" },
  { id: "desktop", label: "Desktop", share: 35, tone: "brand" },
] as const;

/**
 * Weighted health score. Computed so the number and the factors under it can
 * never drift apart.
 */
export const healthFactors = [
  { id: "vitals", label: "Core Web Vitals", score: coreWebVitals.score, weight: 0.3 },
  { id: "indexing", label: "Index coverage", score: 91, weight: 0.25 },
  { id: "backlinks", label: "Backlink quality", score: 78, weight: 0.25 },
  { id: "content", label: "Content freshness", score: 86, weight: 0.2 },
];

export const healthScore = Math.round(
  healthFactors.reduce((s, f) => s + f.score * f.weight, 0)
);

export const lastAuditAt = "2026-07-29T14:32:00Z";
