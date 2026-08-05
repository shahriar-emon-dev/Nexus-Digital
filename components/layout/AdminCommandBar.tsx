"use client";

import { useRouter } from "next/navigation";
import { useRealtime } from "@/lib/supabase/use-realtime";

import * as React from "react";
import { ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CommandPalette } from "@/components/shared/CommandPalette";
import { EmergencyLock } from "@/components/admin/EmergencyLock";
import { defaultCommands } from "./DashboardHeader";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const views = ["Admin", "Client", "Staff"] as const;

/**
 * The admin shell's command bar: view impersonation, the live revenue ticker,
 * and the platform-wide controls. Sticky, so the numbers stay in reach while
 * scrolling long tables.
 */
/**
 * Both figures are derived from invoice_totals and refresh over realtime, so
 * recording a payment updates every admin page without a reload. They are
 * passed in rather than fetched here because this is a client component inside
 * the admin layout — the layout owns the query.
 */
export type CommandBarMetrics = {
  monthlyRevenue: number;
  revenueChangePct: number | null;
  pipeline: number;
  pipelineCount: number;
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Compact above six figures, because the bar has one line to work with. */
function compact(n: number) {
  return n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(1)}M`
    : n >= 100_000
      ? `$${Math.round(n / 1000)}K`
      : money.format(n);
}

export function AdminCommandBar({ metrics }: { metrics?: CommandBarMetrics }) {
  const router = useRouter();

  // Realtime: recording a payment or issuing an invoice updates the bar on
  // every open admin page without a reload. Scoped to the two tables the
  // figures derive from rather than a blanket subscription.
  // Recording a payment or issuing an invoice updates the bar on every open
  // admin page. Scoped to the two tables the figures derive from.
  useRealtime(
    "admin:metrics",
    [{ table: "invoice_payments" }, { table: "invoices" }],
    () => router.refresh()
  );
  const [view, setView] = React.useState<(typeof views)[number]>("Admin");

  return (
    <header
      className={cn(
        "glass sticky top-14 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-line px-5 py-3 lg:top-0 lg:h-20 lg:flex-nowrap lg:px-8 lg:py-0"
      )}
    >
      <div className="flex flex-wrap items-center gap-4 lg:gap-6">
        {/* View impersonation — read-only preview of another role's workspace. */}
        <div
          role="radiogroup"
          aria-label="Preview workspace as"
          className="flex items-center rounded-full border border-line bg-surface-sunken p-1"
        >
          {views.map((v) => {
            const selected = view === v;
            return (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-xs transition-colors duration-(--duration-fast) lg:px-6",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "bg-brand font-bold text-brand-fg shadow-e1"
                    : "font-medium text-ink-tertiary hover:text-ink"
                )}
              >
                {v}
              </button>
            );
          })}
        </div>

        <span className="hidden h-8 w-px bg-line lg:block" aria-hidden />

        <dl className="flex items-center gap-6 lg:gap-8">
          <div>
            <dt className="mb-1 text-[0.625rem] leading-none font-bold tracking-[0.2em] text-ink-tertiary uppercase">
              Monthly Revenue
            </dt>
            <dd className="flex items-center gap-2">
              <span
                data-tabular
                className="font-heading text-[1.375rem] leading-none font-bold text-brand"
              >
                {metrics ? compact(metrics.monthlyRevenue) : "—"}
              </span>
              {/* No prior month means no honest comparison, so the badge is
                  omitted rather than showing a fabricated increase. */}
              {metrics?.revenueChangePct != null && (
                <Badge
                  variant={metrics.revenueChangePct >= 0 ? "success" : "danger"}
                  size="sm"
                >
                  <ArrowUp
                    aria-hidden
                    className={metrics.revenueChangePct < 0 ? "rotate-180" : undefined}
                  />
                  {Math.abs(metrics.revenueChangePct)}%
                </Badge>
              )}
            </dd>
          </div>

          <div>
            <dt className="mb-1 text-[0.625rem] leading-none font-bold tracking-[0.2em] text-ink-tertiary uppercase">
              Sales Pipeline
            </dt>
            <dd className="flex items-center gap-2">
              <span
                data-tabular
                className="font-heading text-[1.375rem] leading-none font-bold text-ion"
              >
                {metrics ? compact(metrics.pipeline) : "—"}
              </span>
              <Badge variant="ion" size="sm">
                {metrics
                  ? `${metrics.pipelineCount} open`
                  : "Active"}
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <EmergencyLock />
        <ThemeToggle />
        <NotificationBell />
        {/* The real palette, not the inert magnifier that used to sit here.
            Admin pages have no `DashboardHeader`, so this is the only ⌘K entry
            point in this shell. */}
        <div className="hidden w-56 xl:block">
          <CommandPalette items={defaultCommands} />
        </div>
      </div>
    </header>
  );
}
