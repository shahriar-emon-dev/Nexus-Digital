"use client";

import * as React from "react";

import {
  Link2,
  Image as ImageIcon,
  BookText,
  Boxes,
  CalendarRange,
  LineChart,
  FileSignature,
  Gauge,
  KeyRound,
  Layers,
  LayoutTemplate,
  LifeBuoy,
  MessageSquareQuote,
  Radar,
  ScrollText,
  Server,
  Settings,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  SquareUser,
  Users,
  Wallet,
  LayoutDashboard,
} from "lucide-react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";
import { filterSections, type Grants } from "@/lib/nav-filter";
import type { NavBadges } from "@/lib/supabase/nav-badges";
import { cn } from "@/lib/utils";

/** Nav hrefs whose badge is a live count rather than a fixed number. */
const BADGE_ROUTES = {
  "/admin/invoices": "invoices",
  "/admin/reviews": "reviews",
} as const;

export const adminSections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Executive Analytics", icon: LayoutDashboard, exact: true },
      {
        href: "/admin/database",
        label: "System Security",
        icon: ShieldAlert,
        children: [
          { href: "/admin/database", label: "Query Intelligence", icon: Radar, exact: true },
        ],
      },
      {
        // The SEO designs shipped their own rail. Their items are added here
        // rather than displacing anything that was already in this sidebar.
        href: "/admin/analytics/seo",
        label: "SEO Intelligence",
        icon: LineChart,
        children: [
          {
            href: "/admin/analytics/seo",
            label: "Overview",
            icon: Gauge,
            exact: true,
          },
          {
            href: "/admin/analytics/keywords",
            label: "Keywords",
            icon: LineChart,
          },
        ],
      },
      { href: "/admin/clients", label: "Client Directory", icon: Users, moduleId: "crm-database", minimum: "view" },
      {
        href: "/admin/staff",
        moduleId: "staff-hr-records",
        minimum: "view",
        label: "Staff & Roles",
        icon: SquareUser,
        children: [
          { href: "/admin/staff", label: "Directory", icon: SquareUser, exact: true },
          { href: "/admin/staff/allocation", label: "Resource Allocation", icon: CalendarRange },
        ],
      },
      { href: "/admin/services", label: "Services Catalog", icon: Boxes, moduleId: "service-management", minimum: "view" },
      { href: "/admin/projects", label: "Project Templates", icon: Layers },
      // No `badge:` literals here. Counts arrive from the database via
      // `applyBadges` below — a hardcoded 4 and 2 advertised six items of
      // outstanding work over an empty table.
      { href: "/admin/invoices", label: "Financials & Invoicing", icon: Wallet, moduleId: "financial-systems", minimum: "view" },
      { href: "/admin/reviews", label: "Review Moderation", icon: MessageSquareQuote },
      {
        href: "/admin/content/blog",
        moduleId: "content-publishing",
        minimum: "view",
        label: "CMS & Content",
        icon: FileSignature,
        // The landing-page engine is a new content surface; the rest already
        // existed as routes with no way to reach them from the rail.
        children: [
          { href: "/admin/content/blog", label: "Blog", icon: FileSignature },
          { href: "/admin/content/pages", label: "Landing Pages", icon: LayoutTemplate },
          { href: "/admin/content/services", label: "Services", icon: Boxes },
          { href: "/admin/content/case-studies", label: "Case Studies", icon: Layers },
          { href: "/admin/content/homepage", label: "Homepage", icon: LayoutDashboard },
          { href: "/admin/media", label: "Media Library", icon: ImageIcon },
          { href: "/admin/content/navigation", label: "Navigation & Menus", icon: Link2 },
        ],
      },
      // Points at the security stub rather than /admin/audit-logs: the
      // Operations section already owns that route, and two nav items sharing a
      // destination means two of them highlight as active at once.
      { href: "/admin/settings/security", label: "Security & Audit Logs", icon: ShieldCheck, moduleId: "security-policies", minimum: "audit" },
      { href: "/admin/settings", label: "System Settings", icon: Settings, exact: true },
    ],
  },
  {
    // Operations items contributed by the SEO / System Core designs.
    label: "Operations",
    items: [
      { href: "/admin/access-control", label: "Access Control", icon: ShieldCheck, moduleId: "security-policies", minimum: "audit" },
      { href: "/admin/keys", label: "Key Management", icon: KeyRound, moduleId: "security-policies", minimum: "admin" },
      { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText, moduleId: "security-policies", minimum: "audit" },
      { href: "/admin/traffic", label: "Traffic Control", icon: SlidersHorizontal },
      { href: "/admin/nodes", label: "Nodes", icon: Server },
    ],
  },
  {
    label: "Help",
    items: [
      { href: "/admin/docs", label: "Docs", icon: BookText },
      { href: "/admin/logs", label: "Logs", icon: ScrollText },
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

const defaultUser: SidebarUser = { name: "Alex Vance", role: "Executive Admin" };

/**
 * Stamps live counts onto the nav tree.
 *
 * Returns a new tree rather than mutating `adminSections`, which is a module
 * level constant shared by every render — mutating it would leak one request's
 * counts into the next person's sidebar.
 */
function applyBadges(sections: NavSection[], badges: NavBadges): NavSection[] {
  return sections.map((section) => ({
    ...section,
    items: section.items.map((item) => {
      const key = BADGE_ROUTES[item.href as keyof typeof BADGE_ROUTES];
      return key ? { ...item, badge: badges[key] } : item;
    }),
  }));
}

/**
 * Live infrastructure readouts, pinned above the navigation.
 *
 * These used to be `load = 24` and `redis = 98` — two constants in a default
 * parameter, animated with a pulsing dot to look like a feed. There is no
 * Redis in this stack. Both are now measured: connection-pool pressure and the
 * Postgres buffer cache hit ratio, the genuine equivalents.
 *
 * A null telemetry prop means the reading is unavailable rather than zero, and
 * the badge says so instead of showing a confident 0%.
 */
export type SidebarTelemetry = {
  connectionPct: number | null;
  cacheHitRatio: number | null;
} | null;

function SystemBadges({ telemetry }: { telemetry: SidebarTelemetry }) {
  const pressure = telemetry?.connectionPct ?? null;
  const cache = telemetry?.cacheHitRatio ?? null;
  const cacheHealthy = cache !== null && cache >= 95;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2">
        <span className="text-[0.6875rem] font-medium text-ink-secondary">Connections</span>
        <span
          data-tabular
          className={cn(
            "text-[0.6875rem] font-bold",
            pressure === null ? "text-ink-tertiary" : pressure > 80 ? "text-warning" : "text-ion"
          )}
        >
          {pressure === null ? "—" : `${pressure}%`}
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2">
        <span className="text-[0.6875rem] font-medium text-ink-secondary">Cache hits</span>
        {cache === null ? (
          <span data-tabular className="text-[0.6875rem] font-bold text-ink-tertiary">
            —
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center gap-1.5 text-[0.6875rem] font-bold",
              cacheHealthy ? "text-success" : "text-warning"
            )}
          >
            <span className="relative flex size-1.5" aria-hidden>
              <span
                className={cn(
                  "absolute inset-0 rounded-full opacity-70",
                  cacheHealthy && "animate-ping bg-success motion-reduce:animate-none",
                  !cacheHealthy && "bg-warning"
                )}
              />
              <span
                className={cn(
                  "relative size-1.5 rounded-full",
                  cacheHealthy ? "bg-success" : "bg-warning"
                )}
              />
            </span>
            <span data-tabular>{cache}%</span>
          </span>
        )}
      </div>
    </div>
  );
}

export function AdminSidebar({
  user = defaultUser,
  grants,
  telemetry = null,
  badges = {},
}: {
  user?: SidebarUser;
  /** Plain `moduleId -> level` map. Filtering happens here, not on the server:
      nav icons are React components and cannot cross the RSC boundary. */
  grants?: Grants;
  /** Measured readouts. Null when the caller cannot read Postgres statistics. */
  telemetry?: SidebarTelemetry;
  /** Live counts for the nav badges, scoped by RLS to what this role can see. */
  badges?: NavBadges;
}) {
  const visible = React.useMemo(
    () => filterSections(applyBadges(adminSections, badges), grants ?? {}),
    [grants, badges]
  );

  return (
    <Sidebar
      sub="Command Center"
      sections={visible}
      user={user}
      header={<SystemBadges telemetry={telemetry} />}
      footer={
        <div className="flex flex-col gap-1">
          {/* These were plain buttons with no handler and no href — visibly
              clickable, but inert. */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            render={<Link href="/admin/settings" />}
          >
            <Settings />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            render={<Link href="/admin/support" />}
          >
            <LifeBuoy />
            Support
          </Button>
        </div>
      }
    />
  );
}
