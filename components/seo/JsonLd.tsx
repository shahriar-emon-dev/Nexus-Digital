import { siteUrl } from "@/lib/site";

/**
 * JSON-LD structured data.
 *
 * Spec §13.2 and §15.3 require it on the homepage, services, blog posts, reviews
 * and about. It appeared nowhere in the codebase — a grep for
 * `application/ld+json` across the whole repository returned nothing — so none
 * of the review stars, article dates or service pricing were eligible for rich
 * results, despite all of that data existing in the database.
 *
 * Serialised with `JSON.stringify` and injected through `dangerouslySetInnerHTML`,
 * which is the only way to emit a script body in React. That is safe **because
 * the payload is an object, not a string**: stringify escapes quotes and
 * backslashes, and the `<` replacement below closes the one remaining hole —
 * a `</script>` sequence inside a value (a blog excerpt could legitimately
 * contain one) would otherwise terminate the tag early and let the rest of the
 * excerpt run as markup.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}

const abs = (path: string) => `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;

/** The agency itself. Rendered once, on the homepage. */
export function organizationLd(opts: {
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  sameAs?: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: opts.name,
    url: siteUrl,
    ...(opts.description ? { description: opts.description } : {}),
    ...(opts.logoUrl ? { logo: abs(opts.logoUrl) } : {}),
    ...(opts.sameAs && opts.sameAs.length > 0 ? { sameAs: opts.sameAs } : {}),
  };
}

/**
 * A service page.
 *
 * `offers` is omitted entirely when no price is set rather than emitted as 0 —
 * a zero-price offer in structured data is a claim that the work is free.
 */
export function serviceLd(opts: {
  name: string;
  slug: string;
  description?: string | null;
  priceFrom?: number | null;
  currency?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: opts.name,
    url: abs(`/services/${opts.slug}`),
    ...(opts.description ? { description: opts.description } : {}),
    provider: { "@type": "Organization", name: "Nexus Digital Agency", url: siteUrl },
    ...(opts.priceFrom && opts.priceFrom > 0
      ? {
          offers: {
            "@type": "Offer",
            price: opts.priceFrom,
            priceCurrency: opts.currency ?? "USD",
            // "from" pricing, stated as such rather than as a fixed price.
            priceSpecification: {
              "@type": "PriceSpecification",
              minPrice: opts.priceFrom,
              priceCurrency: opts.currency ?? "USD",
            },
          },
        }
      : {}),
  };
}

/** A blog post or case study. */
export function articleLd(opts: {
  headline: string;
  url: string;
  excerpt?: string | null;
  coverUrl?: string | null;
  publishedOn?: string | null;
  authorName?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: opts.headline,
    url: abs(opts.url),
    mainEntityOfPage: { "@type": "WebPage", "@id": abs(opts.url) },
    ...(opts.excerpt ? { description: opts.excerpt } : {}),
    ...(opts.coverUrl ? { image: opts.coverUrl } : {}),
    // Omitted rather than defaulted to today: a wrong date is worse in a search
    // result than no date, because Google will display it.
    ...(opts.publishedOn ? { datePublished: opts.publishedOn } : {}),
    ...(opts.authorName ? { author: { "@type": "Person", name: opts.authorName } } : {}),
    publisher: { "@type": "Organization", name: "Nexus Digital Agency", url: siteUrl },
  };
}

/**
 * Aggregate review rating.
 *
 * Returns null below one review. Google requires `reviewCount >= 1` for an
 * AggregateRating and emitting one with zero is both invalid and a
 * misrepresentation — this is exactly the kind of claim that earns a manual
 * action.
 */
export function aggregateRatingLd(opts: {
  ratings: number[];
  name: string;
}): Record<string, unknown> | null {
  const valid = opts.ratings.filter((r) => Number.isFinite(r) && r > 0);
  if (valid.length === 0) return null;

  const mean = valid.reduce((sum, r) => sum + r, 0) / valid.length;

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: opts.name,
    url: siteUrl,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: Math.round(mean * 10) / 10,
      reviewCount: valid.length,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

/** Breadcrumb trail. Improves how the URL is displayed in results. */
export function breadcrumbLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.url),
    })),
  };
}
