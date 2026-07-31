"use client";

import {
  CalendarDays,
  Building2,
  CreditCard,
  FileText,
  FolderKanban,
  FolderOpen,
  Gem,
  Headset,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LineChart,
  MessagesSquare,
  Network,
  Receipt,
  Settings,
  Signal,
  Star,
  Users,
} from "lucide-react";

import { clientAccount, inFlightProjects } from "@/lib/client-portal";
import { billingSummary } from "@/lib/invoices";
import { totalUnread } from "@/lib/messages";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

const sections: NavSection[] = [
  {
    items: [
      { href: "/client", label: "Overview", icon: LayoutDashboard, exact: true },
      {
        href: "/client/projects",
        label: "My Projects",
        icon: FolderKanban,
        // Derived, so the badge cannot drift from the project list.
        badge: inFlightProjects.length,
      },
      {
        href: "/client/messages",
        label: "Messages",
        icon: MessagesSquare,
        badge: totalUnread,
        // The communication design shipped its own nav. These are added under
        // Messages rather than replacing the top level, so nothing that was
        // already here moves.
        children: [
          { href: "/client/messages", label: "Channels", icon: Users, exact: true },
          { href: "/client/messages/direct", label: "Direct Messages", icon: MessagesSquare },
          { href: "/client/messages/threads", label: "Threads", icon: Network },
          { href: "/client/messages/files", label: "Files", icon: FolderOpen },
          { href: "/client/messages/drafts", label: "Drafts", icon: FileText },
        ],
      },
      {
        href: "/client/invoices",
        label: "Invoices",
        icon: Receipt,
        // Only shouts when something is actually overdue.
        alert: billingSummary.overdueCount > 0,
        // From the billing design's own nav — added, not substituted.
        children: [
          { href: "/client/invoices", label: "All Invoices", icon: Receipt, exact: true },
          { href: "/client/invoices/payments", label: "Payments", icon: CreditCard },
          { href: "/client/invoices/insights", label: "Insights", icon: LineChart },
          { href: "/client/invoices/tax-reports", label: "Tax Reports", icon: Landmark },
        ],
      },
    ],
  },
  {
    label: "Engagement",
    items: [
      { href: "/client/meetings", label: "Meetings", icon: CalendarDays },
      { href: "/client/reports", label: "Reports", icon: Star },
      { href: "/client/reviews/new", label: "Leave a review", icon: Star },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/client/settings", label: "Settings", icon: Settings },
      // Also from the communication design's nav.
      { href: "/client/help", label: "Help", icon: LifeBuoy },
      { href: "/client/support", label: "Support", icon: Headset },
      { href: "/client/status", label: "Status", icon: Signal },
      // "Clients" in the billing design's rail. Scoped under /client so it means
      // the account's own billing entities, not other tenants.
      { href: "/client/entities", label: "Clients", icon: Building2 },
    ],
  },
];

const defaultUser: SidebarUser = {
  name: "Priya Raman",
  role: clientAccount.name,
  avatar: undefined,
};

export function ClientSidebar({ user = defaultUser }: { user?: SidebarUser }) {
  return (
    <Sidebar
      sub="Client Portal"
      sections={sections}
      user={user}
      header={
        // Account health used to live here as a ring. It is now the hero gauge on
        // the overview, and rendering the same score in two places invites the
        // two to disagree.
        <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand/15 text-brand">
            <Gem className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[0.8125rem] font-medium text-ink">
              {clientAccount.name}
            </p>
            <p className="text-[0.6875rem] text-ink-tertiary">{clientAccount.tier}</p>
          </div>
        </div>
      }
    />
  );
}
