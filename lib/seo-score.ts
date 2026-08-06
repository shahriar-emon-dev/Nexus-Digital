/**
 * SEO completeness, computed from the fields that are actually filled.
 *
 * The design shows this as a "72%" pill next to SEO Settings. It is derived on
 * every render rather than stored, so it cannot report 72% for a page whose
 * description was cleared five minutes ago — the same reason no money is stored
 * on an invoice.
 *
 * This measures COMPLETENESS, not quality. It says which fields are filled and
 * whether they are a sensible length; it makes no claim about whether the page
 * will rank, because nothing here could know that.
 */

export type SeoCheck = {
  id: string;
  label: string;
  /** Passing checks contribute their weight to the score. */
  weight: number;
  passed: boolean;
  hint: string;
};

export type SeoScore = {
  /** 0–100, rounded. */
  percent: number;
  checks: SeoCheck[];
  passed: number;
  total: number;
};

/** Search engines truncate around these; they do not reject longer values. */
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

const text = (seo: Record<string, unknown>, key: string) => {
  const value = seo[key];
  return typeof value === "string" ? value.trim() : "";
};

export function scoreSeo(
  seo: Record<string, unknown>,
  page: { title?: string; slug?: string } = {}
): SeoScore {
  const title = text(seo, "title");
  const description = text(seo, "description");
  const ogImage = text(seo, "ogImage") || text(seo, "og_image");
  const slug = (page.slug ?? "").trim();

  const checks: SeoCheck[] = [
    {
      id: "title",
      label: "Search title set",
      weight: 30,
      passed: title.length > 0,
      hint: "Without one, search engines fall back to the page heading.",
    },
    {
      id: "title-length",
      label: `Title within ${TITLE_MAX} characters`,
      weight: 10,
      // An unset title cannot pass a length check — otherwise an empty page
      // would score points for brevity.
      passed: title.length > 0 && title.length <= TITLE_MAX,
      hint: `Currently ${title.length}. Longer titles are truncated in results.`,
    },
    {
      id: "description",
      label: "Meta description set",
      weight: 30,
      passed: description.length > 0,
      hint: "This is the snippet under the link in a search result.",
    },
    {
      id: "description-length",
      label: `Description within ${DESCRIPTION_MAX} characters`,
      weight: 10,
      passed: description.length > 0 && description.length <= DESCRIPTION_MAX,
      hint: `Currently ${description.length}. Longer descriptions are cut off.`,
    },
    {
      id: "share-image",
      label: "Share image set",
      weight: 10,
      passed: ogImage.length > 0,
      hint: "Used when the page is posted to social platforms.",
    },
    {
      id: "slug",
      label: "Readable URL",
      weight: 10,
      passed: slug.length > 0 && !/^page-|untitled|[0-9a-f]{8}-/i.test(slug),
      hint: "A generated slug like 'untitled-2' tells a reader nothing.",
    },
  ];

  const total = checks.reduce((n, c) => n + c.weight, 0);
  const earned = checks.reduce((n, c) => n + (c.passed ? c.weight : 0), 0);

  return {
    percent: Math.round((earned / total) * 100),
    checks,
    passed: checks.filter((c) => c.passed).length,
    total: checks.length,
  };
}
