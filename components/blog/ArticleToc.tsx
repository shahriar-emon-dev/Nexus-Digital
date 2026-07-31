"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export type TocItem = { id: string; heading: string };

/**
 * Table of contents with scrollspy.
 *
 * The source recomputed `offsetTop` for every section on every scroll event —
 * a forced layout per frame — and matched links with `href.includes(current)`,
 * so `#result` would also light up `#result-summary`. This observes the
 * headings instead and matches ids exactly.
 */
export function ArticleToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = React.useState(items[0]?.id ?? "");

  React.useEffect(() => {
    const nodes = items
      .map((i) => document.getElementById(i.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav aria-label="Table of contents">
      <h2 className="mb-6 text-xs font-semibold tracking-[0.2em] text-ink-tertiary uppercase">
        Table of Contents
      </h2>
      <ul className="flex flex-col gap-4 border-l border-line">
        {items.map((item) => {
          const selected = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "-ml-px block border-l-2 pl-4 text-sm font-medium transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "border-brand text-brand"
                    : "border-transparent text-ink-tertiary hover:text-ink"
                )}
              >
                {item.heading}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
