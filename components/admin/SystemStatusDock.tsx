"use client";

import * as React from "react";
import { ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

const links = [
  // Pointed at the routes that own each concern. These were `href="#"`, which
  // renders a focusable link that goes nowhere.
  { label: "API Docs", href: "/admin/docs" },
  { label: "Internal Wiki", href: "/admin/docs" },
  { label: "Database", href: "/admin/database" },
];

/**
 * Floating status dock. Collapsible, because a fixed 18rem panel parked over the
 * bottom-right corner will sooner or later sit on top of a table's last row or
 * a chart's axis, and the operator needs a way to move it.
 *
 * The status line was a hardcoded "System status: optimal" with a pulsing dot,
 * which is the most dangerous kind of fake reading: it looks like a monitor and
 * would say "optimal" through an outage. It now reflects one thing that is
 * actually measured — connection-pool pressure — and says so, or reports that
 * nothing is being measured.
 */
export function SystemStatusDock({
  connectionPct = null,
}: {
  /** Pool utilisation, measured by Postgres. Null when unavailable. */
  connectionPct?: number | null;
}) {
  // Collapsed by default. Expanded, this panel is 18rem of fixed overlay in
  // the bottom-right corner, and it was covering the last row of every long
  // table and the Deploy button on Access Control — a click landed on the dock
  // instead of the control underneath it. An operator opens it when they want
  // it; it does not open itself on top of their work.
  const [open, setOpen] = React.useState(false);

  const state =
    connectionPct === null
      ? { label: "Database status: not reported", tone: "bg-ink-tertiary", pulse: false }
      : connectionPct > 90
        ? { label: `Connection pool: ${connectionPct}% — saturated`, tone: "bg-danger", pulse: true }
        : connectionPct > 80
          ? { label: `Connection pool: ${connectionPct}% — high`, tone: "bg-warning", pulse: true }
          : { label: `Connection pool: ${connectionPct}% — nominal`, tone: "bg-ion", pulse: true };

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {open && (
        <aside
          aria-label="System status"
          className="glass w-72 rounded-xl p-4 shadow-e4"
        >
          <p className="mb-3 flex items-center gap-2">
            <span className="relative flex size-2" aria-hidden>
              {state.pulse && (
                <span
                  className={cn(
                    "absolute inset-0 animate-ping rounded-full opacity-70 motion-reduce:animate-none",
                    state.tone
                  )}
                />
              )}
              <span className={cn("relative size-2 rounded-full", state.tone)} />
            </span>
            <span className="text-xs font-semibold tracking-wider text-ink">{state.label}</span>
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
