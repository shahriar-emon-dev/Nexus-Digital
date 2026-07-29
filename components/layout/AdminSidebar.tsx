"use client";

import {
  Boxes,
  FileSignature,
  Layers,
  LifeBuoy,
  MessageSquareQuote,
  Settings,
  ShieldCheck,
  SquareUser,
  Users,
  Wallet,
  LayoutDashboard,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

const sections: NavSection[] = [
  {
    items: [
      { href: "/admin", label: "Executive Analytics", icon: LayoutDashboard, exact: true },
      { href: "/admin/clients", label: "Client Directory", icon: Users },
      { href: "/admin/staff", label: "Staff & Roles", icon: SquareUser },
      { href: "/admin/services", label: "Services Catalog", icon: Boxes },
      { href: "/admin/projects", label: "Project Templates", icon: Layers },
      { href: "/admin/invoices", label: "Financials & Invoicing", icon: Wallet, badge: 4 },
      { href: "/admin/reviews", label: "Review Moderation", icon: MessageSquareQuote, badge: 2 },
      { href: "/admin/content/blog", label: "CMS & Content", icon: FileSignature },
      { href: "/admin/settings", label: "Security & Audit Logs", icon: ShieldCheck, exact: true },
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

export function AdminSidebar({ user = defaultUser }: { user?: SidebarUser }) {
  return (
    <Sidebar
      sub="Command Center"
      sections={sections}
      user={user}
      header={<SystemBadges />}
      footer={
        <div className="flex flex-col gap-1">
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <Settings />
            Settings
          </Button>
          <Button variant="ghost" size="sm" className="w-full justify-start">
            <LifeBuoy />
            Support
          </Button>
        </div>
      }
    />
  );
}
