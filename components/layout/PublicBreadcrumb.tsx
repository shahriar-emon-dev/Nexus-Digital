"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const titleCase = (segment: string) =>
  segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Route indicator for the public shell. Derived from the pathname rather than
 * hand-maintained per page, so it can never fall out of sync with the routes.
 * Renders nothing on the homepage — a crumb trail with a single stop is noise.
 */
export function PublicBreadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((segment, i) => ({
    label: titleCase(decodeURIComponent(segment)),
    href: "/" + segments.slice(0, i + 1).join("/"),
    last: i === segments.length - 1,
  }));

  return (
    <nav
      aria-label="Breadcrumb"
      className="mx-auto w-full max-w-7xl px-4 pt-12 md:px-10"
    >
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold tracking-widest uppercase">
        <li className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand/60 transition-colors hover:text-brand"
          >
            <Home className="size-4" aria-hidden />
            Nexus
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.href} className="flex items-center gap-2">
            <ChevronRight className="size-3 text-brand/40" aria-hidden />
            {crumb.last ? (
              <span className="text-brand" aria-current="page">
                {crumb.label}
              </span>
            ) : (
              <Link
                href={crumb.href}
                className="text-brand/60 transition-colors hover:text-brand"
              >
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
