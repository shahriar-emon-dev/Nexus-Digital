"use client";

import * as React from "react";
import { Building2, FolderKanban, LifeBuoy, Receipt, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { CommandPalette, type CommandItem } from "@/components/shared/CommandPalette";
import { NotificationBell, type Notification } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

/**
 * The palette and the bell are fed by the surrounding layout.
 *
 * Both used to ship hardcoded contents: the palette listed a "Halcyon" account
 * that existed nowhere else and an invoice INV-2043 that was never issued, and
 * the bell showed three invented notifications to everybody, including the
 * "$12,400 overdue" line. Empty is the correct default — a shell that has not
 * been given data should show none, not somebody else's.
 */
const noCommands: CommandItem[] = [];
const noNotifications: Notification[] = [];

/**
 * Shared top bar for all three dashboards. Sticky and glassy so long tables keep
 * their controls in reach while scrolling.
 */
export function DashboardHeader({
  title,
  titleAs = "h1",
  description,
  breadcrumbs,
  actions,
  presence,
  commands = noCommands,
  notifications = noNotifications,
  className,
}: {
  title: string;
  /**
   * Pages that render their own page heading pass "p", so the route title in
   * this bar does not become a second <h1> saying the same thing.
   */
  titleAs?: "h1" | "p";
  description?: string;
  breadcrumbs?: { label: string; href?: string }[];
  actions?: React.ReactNode;
  /** Who else is in here right now — sits left of the utility controls. */
  presence?: React.ReactNode;
  commands?: CommandItem[];
  notifications?: Notification[];
  className?: string;
}) {
  return (
    <header
      className={cn(
        // Below `lg` the sidebar's fixed mobile bar occupies the top 3.5rem, so
        // this sticks beneath it rather than underneath it.
        "sticky top-14 z-30 flex flex-col gap-4 border-b border-line px-5 py-4 lg:top-0 lg:px-8",
        "glass supports-[backdrop-filter]:bg-surface/70",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="hidden min-w-0 flex-1 md:block">
          <CommandPalette items={commands} />
        </div>
        <div className="ml-auto flex items-center gap-3">
          {presence}
          <ThemeToggle />
          <NotificationBell notifications={notifications} />
          {actions}
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mb-1.5">
              <ol className="flex flex-wrap items-center gap-1.5 text-xs text-ink-tertiary">
                {breadcrumbs.map((crumb, i) => (
                  <li key={crumb.label} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden>/</span>}
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="rounded-sm transition-colors hover:text-ink-secondary"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span aria-current="page">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {titleAs === "h1" ? (
            <h1 className="font-heading text-h3 font-semibold text-ink">{title}</h1>
          ) : (
            <p className="font-heading text-h3 font-semibold text-ink">{title}</p>
          )}
          {description && (
            <p className="mt-1 max-w-prose text-sm text-ink-tertiary">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}
