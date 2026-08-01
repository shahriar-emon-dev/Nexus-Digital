"use client";

import * as React from "react";

import {
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
      { href: "/admin/invoices", label: "Financials & Invoicing", icon: Wallet, badge: 4, moduleId: "financial-systems", minimum: "view" },
      { href: "/admin/reviews", label: "Review Moderation", icon: MessageSquareQuote, badge: 2 },
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
          { href: "/admin/content/case-studies", label: "Case Studies", icon: Layers },
          { href: "/admin/content/homepage", label: "Homepage", icon: LayoutDashboard },
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

/** Live infrastructure readouts, pinned above the navigation. */
function SystemBadges({ load = 24, redis = 98 }: { load?: number; redis?: number }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2">
        <span className="text-[0.6875rem] font-medium text-ink-secondary">System Load</span>
        <span data-tabular className="text-[0.6875rem] font-bold text-ion">
          {load}%
        </span>
      </div>
      <div className="flex items-center justify-between rounded-lg border border-line-subtle bg-surface-sunken px-3 py-2">
        <span className="text-[0.6875rem] font-medium text-ink-secondary">Redis</span>
        <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold text-success">
          <span className="relative flex size-1.5" aria-hidden>
            <span className="absolute inset-0 animate-ping rounded-full bg-success opacity-70 motion-reduce:animate-none" />
            <span className="relative size-1.5 rounded-full bg-success" />
          </span>
          <span data-tabular>{redis}% Healthy</span>
        </span>
      </div>
    </div>
  );
}

export function AdminSidebar({
  user = defaultUser,
  grants,
}: {
  user?: SidebarUser;
  /** Plain `moduleId -> level` map. Filtering happens here, not on the server:
      nav icons are React components and cannot cross the RSC boundary. */
  grants?: Grants;
}) {
  const visible = React.useMemo(
    () => filterSections(adminSections, grants ?? {}),
    [grants]
  );

  return (
    <Sidebar
      sub="Command Center"
      sections={visible}
      user={user}
      header={<SystemBadges />}
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
