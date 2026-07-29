"use client";

import {
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Receipt,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

const sections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Executive", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Operations",
    items: [
      { href: "/admin/clients", label: "Clients", icon: Building2 },
      { href: "/admin/projects", label: "Projects", icon: FolderKanban },
      { href: "/admin/staff", label: "Staff", icon: Users },
      { href: "/admin/meetings", label: "Meetings", icon: CalendarDays },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/admin/services", label: "Services", icon: Sparkles },
      { href: "/admin/invoices", label: "Invoices", icon: Receipt, badge: 4 },
      { href: "/admin/reviews", label: "Review queue", icon: Star, badge: 2 },
    ],
  },
  {
    label: "Content",
    items: [{ href: "/admin/content/blog", label: "CMS", icon: FileText }],
  },
  {
    label: "System",
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/settings/security", label: "Security", icon: ShieldCheck },
      { href: "/admin/settings", label: "Settings", icon: Settings, exact: true },
    ],
  },
];

const defaultUser: SidebarUser = { name: "Alex Mercer", role: "Agency Owner" };

export function AdminSidebar({ user = defaultUser }: { user?: SidebarUser }) {
  return (
    <Sidebar
      sub="Command"
      sections={sections}
      user={user}
      header={
        <dl className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-surface-sunken px-3 py-2">
            <dt className="text-[0.625rem] tracking-wide text-ink-tertiary uppercase">MRR</dt>
            <dd data-tabular className="font-heading text-sm font-semibold text-ink">
              $184.2k
            </dd>
          </div>
          <div className="rounded-lg bg-surface-sunken px-3 py-2">
            <dt className="text-[0.625rem] tracking-wide text-ink-tertiary uppercase">
              Pipeline
            </dt>
            <dd data-tabular className="font-heading text-sm font-semibold text-ink">
              $612k
            </dd>
          </div>
        </dl>
      }
    />
  );
}
