"use client";

import * as React from "react";
import { Building2, FolderKanban, LifeBuoy, Receipt, Users } from "lucide-react";

import { cn } from "@/lib/utils";
import { CommandPalette, type CommandItem } from "@/components/shared/CommandPalette";
import { NotificationBell, type Notification } from "@/components/shared/NotificationBell";
import { ThemeToggle } from "@/components/shared/ThemeToggle";

const defaultCommands: CommandItem[] = [
  { id: "p1", group: "Projects", label: "Northwind — Site rebuild", hint: "In progress", href: "/client/projects", icon: FolderKanban },
  { id: "p2", group: "Projects", label: "Halcyon — Paid media Q3", hint: "In review", href: "/client/projects", icon: FolderKanban },
  { id: "i1", group: "Invoices", label: "INV-2043", hint: "Overdue · $12,400", href: "/client/invoices", icon: Receipt },
  { id: "c1", group: "Clients", label: "Northwind Retail", href: "/admin/clients", icon: Building2 },
  { id: "s1", group: "People", label: "Dez Okafor", hint: "Team Lead", href: "/admin/staff", icon: Users },
  { id: "h1", group: "Help", label: "Contact support", href: "/contact", icon: LifeBuoy },
];

const defaultNotifications: Notification[] = [
  {
    id: "n1",
    kind: "message",
    title: "Dez replied on Site rebuild",
    body: "Staging is up — take a look at the new checkout flow when you get a minute.",
    time: "12 min ago",
  },
  {
    id: "n2",
    kind: "invoice",
    title: "Invoice INV-2043 is overdue",
    body: "$12,400 · due 4 days ago",
    time: "2 hours ago",
  },
  {
    id: "n3",
    kind: "project",
    title: "Milestone completed: Design system",
    time: "Yesterday",
    read: true,
  },
];

/**
 * Shared top bar for all three dashboards. Sticky and glassy so long tables keep
 * their controls in reach while scrolling.
 */
export function DashboardHeader({
  title,
  description,
  breadcrumbs,
  actions,
  presence,
  commands = defaultCommands,
  notifications = defaultNotifications,
  className,
}: {
  title: string;
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
          <h1 className="font-heading text-h3 font-semibold text-ink">{title}</h1>
          {description && (
            <p className="mt-1 max-w-prose text-sm text-ink-tertiary">{description}</p>
          )}
        </div>
      </div>
    </header>
  );
}
