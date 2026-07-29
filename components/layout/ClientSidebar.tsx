"use client";

import {
  CalendarDays,
  FolderKanban,
  LayoutDashboard,
  MessagesSquare,
  Receipt,
  Settings,
  Star,
} from "lucide-react";

import { ProgressRing } from "@/components/ui/progress";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

const sections: NavSection[] = [
  {
    items: [
      { href: "/client", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/client/projects", label: "My Projects", icon: FolderKanban, badge: 3 },
      { href: "/client/messages", label: "Messages", icon: MessagesSquare, badge: 5 },
      { href: "/client/invoices", label: "Invoices", icon: Receipt, alert: true },
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
    items: [{ href: "/client/settings", label: "Settings", icon: Settings }],
  },
];

const defaultUser: SidebarUser = {
  name: "Priya Raman",
  role: "Northwind Retail",
  avatar: undefined,
};

export function ClientSidebar({
  user = defaultUser,
  healthScore = 94,
}: {
  user?: SidebarUser;
  healthScore?: number;
}) {
  const tone = healthScore >= 80 ? "success" : healthScore >= 55 ? "warning" : "danger";

  return (
    <Sidebar
      sub="Client Portal"
      sections={sections}
      user={user}
      header={
        <div className="flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
          <ProgressRing value={healthScore} size={40} tone={tone} />
          <div className="min-w-0">
            <p className="text-[0.8125rem] font-medium text-ink">Account health</p>
            <p className="text-[0.6875rem] text-ink-tertiary">
              {tone === "success" ? "Excellent" : tone === "warning" ? "Needs review" : "At risk"}
            </p>
          </div>
        </div>
      }
    />
  );
}
