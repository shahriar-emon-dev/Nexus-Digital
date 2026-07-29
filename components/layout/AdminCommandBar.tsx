"use client";

import * as React from "react";
import { ArrowUp, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmergencyLock } from "@/components/admin/EmergencyLock";
import { NotificationBell } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const views = ["Admin", "Client", "Staff"] as const;

/**
 * The admin shell's command bar: view impersonation, the live revenue ticker,
 * and the platform-wide controls. Sticky, so the numbers stay in reach while
 * scrolling long tables.
 */
export function AdminCommandBar() {
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
                $142,500
              </span>
              <Badge variant="success" size="sm">
                <ArrowUp aria-hidden />
                12%
              </Badge>
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
                $2.1M
              </span>
              <Badge variant="ion" size="sm">
                Active
              </Badge>
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex items-center gap-2 lg:gap-3">
        <EmergencyLock />
        <ThemeToggle />
        <NotificationBell />
        <Button variant="ghost" size="icon-sm" aria-label="Search">
          <Search />
        </Button>
      </div>
    </header>
  );
}
