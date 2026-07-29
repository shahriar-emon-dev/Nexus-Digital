"use client";

import * as React from "react";
import { Calculator, Route, ShieldCheck, Terminal } from "lucide-react";

import { cn } from "@/lib/utils";

const sections = [
  { id: "roi", label: "ROI Calculator", icon: Calculator },
  { id: "stack", label: "Tech Stack", icon: Terminal },
  { id: "roadmap", label: "Roadmap", icon: Route },
  { id: "results", label: "Case Studies", icon: ShieldCheck },
];

/**
 * In-page section rail.
 *
 * The source hard-coded which item was "active". This tracks the reader with an
 * IntersectionObserver so the highlight reflects where they actually are.
 *
 * It is `sticky` inside the page grid rather than `fixed` to the viewport edge:
 * the public shell already owns a fixed header, and a second viewport-anchored
 * rail would sit on top of it and fight the shell's centred container.
 */
export function ServiceSectionNav() {
  const [active, setActive] = React.useState(sections[0].id);

  React.useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((n): n is HTMLElement => Boolean(n));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -55% 0px", threshold: 0 }
    );

    nodes.forEach((n) => observer.observe(n));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="On this page"
      className="sticky top-28 hidden self-start rounded-2xl border border-line bg-surface-sunken/60 py-6 md:block"
    >
      <div className="mb-6 hidden px-6 xl:block">
        <p className="font-heading text-lg font-semibold text-brand">Nexus Detail</p>
        <p className="text-xs tracking-widest text-ink-tertiary uppercase">
          Performance Insights
        </p>
      </div>

      <ul className="flex flex-col gap-2">
        {sections.map((section) => {
          const selected = active === section.id;
          return (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "flex items-center gap-4 border-r-4 px-6 py-4 transition-colors duration-(--duration-fast)",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "border-brand bg-brand-subtle text-brand-subtle-fg"
                    : "border-transparent text-ink-secondary hover:bg-surface-sunken hover:text-ink"
                )}
              >
                <section.icon className="size-5 shrink-0" aria-hidden />
                <span className="hidden xl:block">{section.label}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
