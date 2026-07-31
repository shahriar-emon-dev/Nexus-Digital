import Link from "next/link";

import { cn } from "@/lib/utils";

export type Crumb = { label: string; href?: string };

/**
 * Breadcrumb trail, on its own.
 *
 * The admin shell already has a header — `AdminCommandBar` — so admin pages
 * cannot use `DashboardHeader` without stacking two bars and rendering the
 * theme toggle and notification bell twice. They render this above their
 * heading instead.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("mb-3", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-tertiary">
        {items.map((crumb, i) => (
          <li key={crumb.label} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>/</span>}
            {crumb.href ? (
              <Link
                href={crumb.href}
                className="rounded-sm transition-colors hover:text-ink-secondary focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                {crumb.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink-secondary">
                {crumb.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
