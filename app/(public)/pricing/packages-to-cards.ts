import type { PricingPackage } from "@/lib/supabase/marketing-actions";

/**
 * Maps a stored package onto the card the directory renders.
 *
 * Kept out of the client component so the formatting rules live in one place
 * and the component stays a renderer.
 */
export type ServiceCard = {
  slug: string;
  title: string;
  blurb: string;
  category: string;
  model: string;
  modelLabel: string;
  price: string;
  features: string[];
  href: string;
};

const periodLabel: Record<string, string> = {
  month: "/mo",
  project: " per project",
  day: "/day",
  hour: "/hr",
};

export function toServiceCard(pkg: PricingPackage): ServiceCard {
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: pkg.currency || "USD",
    maximumFractionDigits: 0,
  });

  return {
    slug: pkg.slug,
    title: pkg.name,
    blurb: pkg.blurb ?? "",
    category: pkg.category ?? "Other",
    model: pkg.model,
    modelLabel: pkg.model,
    // Null means bespoke, not free. Rendering a zero here would read as "$0".
    price:
      pkg.price_amount === null
        ? "On request"
        : `${money.format(Number(pkg.price_amount))}${
            pkg.price_period ? periodLabel[pkg.price_period] ?? "" : ""
          }`,
    features: Array.isArray(pkg.features) ? (pkg.features as string[]) : [],
    // Only links to a service page when one is attached and published.
    href: pkg.serviceSlug ? `/services/${pkg.serviceSlug}` : "/contact",
  };
}
