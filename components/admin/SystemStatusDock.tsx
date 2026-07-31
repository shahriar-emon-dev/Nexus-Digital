"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  // Pointed at the routes that own each concern. These were `href="#"`, which
  // renders a focusable link that goes nowhere.
  { label: "API Docs", href: "/admin/docs" },
  { label: "Internal Wiki", href: "/admin/docs" },
  { label: "System Health", href: "/admin/nodes" },
];

/**
 * Floating status dock. Collapsible, because a fixed 18rem panel parked over the
 * bottom-right corner will sooner or later sit on top of a table's last row or
 * a chart's axis, and the operator needs a way to move it.
 */
export function SystemStatusDock() {
  const [open, setOpen] = React.useState(true);

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <aside
          aria-label="System status"
          className="glass w-72 rounded-xl p-4 shadow-e4"
        >
          <p className="mb-3 flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden>
              <span className="absolute inset-0 animate-ping rounded-full bg-ion opacity-70 motion-reduce:animate-none" />
              <span className="relative size-2 rounded-full bg-ion" />
            </span>
            <span className="text-xs font-semibold tracking-wider text-ink">
              System status: optimal
            </span>
          </p>

          <div className="flex flex-wrap justify-end gap-x-4 gap-y-1">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[0.6875rem] font-semibold text-ink-tertiary transition-colors hover:text-ion focus-visible:text-ion focus-visible:outline-none"
              >
                {link.label}
              </a>
            ))}
          </div>

          <p className="mt-2 text-right text-[0.625rem] text-ink-tertiary">
            © {new Date().getFullYear()} Nexus Digital Agency. Performance optimized.
          </p>
        </aside>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={cn(
          "glass flex items-center gap-2 rounded-full px-3.5 py-2 shadow-e3",
          "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
          "hover:-translate-y-0.5 hover:border-brand-line",
          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        )}
      >
        <span className="relative flex size-2" aria-hidden>
          <span className="relative size-2 rounded-full bg-ion" />
        </span>
        <span className="text-[0.6875rem] font-semibold text-ink">
          {open ? "Hide status" : "System status"}
        </span>
        <ChevronUp
          className={cn(
            "size-3.5 text-ink-tertiary transition-transform duration-(--duration-normal)",
            open && "rotate-180"
          )}
          aria-hidden
        />
      </button>
    </div>
  );
}
