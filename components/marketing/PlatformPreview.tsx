import {
  BarChart3,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/layout/Logo";

const revenue = [
  { month: "Feb", value: 118 },
  { month: "Mar", value: 132 },
  { month: "Apr", value: 127 },
  { month: "May", value: 149 },
  { month: "Jun", value: 161 },
  { month: "Jul", value: 158 },
  { month: "Aug", value: 184 },
];

const tiles = [
  { label: "MRR", value: "$184.2k", delta: "+12.4%", good: true },
  { label: "Active projects", value: "18", delta: "+3", good: true },
  { label: "Utilisation", value: "87%", delta: "−2.1%", good: false },
];

const board = [
  { column: "In progress", accent: "bg-info", cards: ["Checkout rebuild", "GA4 server-side"] },
  { column: "In review", accent: "bg-warning", cards: ["Category taxonomy"] },
  { column: "Shipped", accent: "bg-brand", cards: ["Design system", "Perf budget"] },
];

/**
 * Static product preview for the hero. Everything is drawn with the real design
 * tokens rather than an image, so it stays sharp and tracks the theme.
 */
export function PlatformPreview() {
  return (
    <div
      className="relative"
      role="img"
      aria-label="The Nexus admin dashboard, showing monthly recurring revenue of $184,200 up 12.4 percent, a revenue chart trending upward from February to August, and a project board with work in progress, in review and shipped columns."
    >
      <div className="glow-brand overflow-hidden rounded-2xl">
        <div className="edge-lit glass overflow-hidden rounded-2xl shadow-e4">
          {/* window chrome */}
          <div className="flex items-center gap-2 border-b border-line-subtle px-4 py-2.5">
            <span className="flex gap-1.5" aria-hidden>
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
              <span className="size-2.5 rounded-full bg-line-strong" />
            </span>
            <span className="mx-auto rounded-md bg-surface-sunken px-3 py-1 font-mono text-[0.625rem] text-ink-tertiary">
              nexus.agency/admin
            </span>
          </div>

          <div className="flex">
            {/* mini sidebar */}
            <div className="hidden w-44 shrink-0 flex-col gap-1 border-r border-line-subtle p-3 sm:flex">
              <div className="mb-2 flex items-center gap-2 px-1.5">
                <LogoMark className="size-6" />
                <span className="font-heading text-xs font-bold text-ink">Nexus</span>
              </div>
              {[
                { Icon: LayoutDashboard, label: "Executive", active: true },
                { Icon: Building2, label: "Clients" },
                { Icon: FolderKanban, label: "Projects" },
                { Icon: BarChart3, label: "Analytics" },
                { Icon: Receipt, label: "Invoices" },
                { Icon: Settings, label: "Settings" },
              ].map(({ Icon, label, active }) => (
                <div
                  key={label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[0.6875rem] font-medium",
                    active
                      ? "bg-brand-subtle text-brand-subtle-fg"
                      : "text-ink-tertiary"
                  )}
                >
                  <Icon className="size-3.5" aria-hidden />
                  {label}
                </div>
              ))}
            </div>

            {/* body */}
            <div className="min-w-0 flex-1 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-heading text-sm font-semibold text-ink">
                  Executive overview
                </p>
                <Badge variant="success" size="sm">
                  Live
                </Badge>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2.5">
                {tiles.map((tile) => (
                  <div
                    key={tile.label}
                    className="rounded-xl border border-line bg-surface p-3"
                  >
                    <p className="truncate text-[0.625rem] tracking-wide text-ink-tertiary uppercase">
                      {tile.label}
                    </p>
                    <p
                      data-tabular
                      className="mt-1 font-heading text-base leading-none font-semibold text-ink"
                    >
                      {tile.value}
                    </p>
                    <p
                      data-tabular
                      className={cn(
                        "mt-1 text-[0.625rem] font-medium",
                        tile.good ? "text-success" : "text-danger"
                      )}
                    >
                      {tile.good ? "▲" : "▼"} {tile.delta}
                    </p>
                  </div>
                ))}
              </div>

              <RevenueChart />

              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {board.map((col) => (
                  <div
                    key={col.column}
                    className="rounded-xl border border-line bg-surface-sunken/60 p-2.5"
                  >
                    <p className="flex items-center gap-1.5 text-[0.625rem] font-semibold text-ink-secondary">
                      <span className={cn("size-1.5 rounded-full", col.accent)} aria-hidden />
                      {col.column}
                    </p>
                    <div className="mt-2 flex flex-col gap-1.5">
                      {col.cards.map((card) => (
                        <div
                          key={card}
                          className="truncate rounded-lg border border-line bg-surface px-2 py-1.5 text-[0.625rem] text-ink-secondary"
                        >
                          {card}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Single-series column chart — one series, so no legend box; the title names it.
 * Bars carry a 2px surface gap, rounded data-ends anchored to the baseline, and
 * a recessive hairline grid. The peak is direct-labelled rather than labelling
 * every column.
 */
function RevenueChart() {
  const max = Math.max(...revenue.map((d) => d.value));
  const peak = revenue.findIndex((d) => d.value === max);

  return (
    <figure className="mt-2.5 rounded-xl border border-line bg-surface p-3.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="text-[0.6875rem] font-medium text-ink-secondary">
          Monthly recurring revenue
        </span>
        <span className="text-[0.625rem] text-ink-tertiary">$000s</span>
      </figcaption>

      <div className="relative mt-3 h-24">
        {/* gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="h-px w-full bg-chart-grid" />
          ))}
        </div>

        <div className="relative flex h-full items-end gap-[2px]">
          {revenue.map((d, i) => (
            <div key={d.month} className="group/bar relative flex h-full flex-1 items-end">
              <div
                className="w-full rounded-t-[4px] bg-chart-1 transition-opacity duration-(--duration-fast) group-hover/bar:opacity-80"
                style={{ height: `${(d.value / max) * 100}%` }}
              />
              {i === peak && (
                <span
                  data-tabular
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 -translate-y-full rounded bg-surface-inverse px-1.5 py-0.5 text-[0.5625rem] font-semibold text-ink-inverse"
                >
                  {d.value}
                </span>
              )}
              {/* hover read-out */}
              <span
                data-tabular
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 rounded-md border border-line bg-surface-raised px-1.5 py-1 text-[0.5625rem] whitespace-nowrap text-ink opacity-0 shadow-e2 transition-opacity duration-(--duration-fast) group-hover/bar:opacity-100"
              >
                {d.month} · ${d.value}k
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-1.5 flex gap-[2px]">
        {revenue.map((d) => (
          <span
            key={d.month}
            className="flex-1 text-center text-[0.5625rem] text-ink-tertiary"
          >
            {d.month}
          </span>
        ))}
      </div>
    </figure>
  );
}
