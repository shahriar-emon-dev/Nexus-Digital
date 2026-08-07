"use client";

import * as React from "react";
import {
  Bell,
  CalendarDays,
  Cog,
  FolderOpen,
  MessagesSquare,
  LifeBuoy,
  LayoutDashboard,
  Monitor,
  Plus,
  Settings,
  SquareKanban,
  Timer,
} from "lucide-react";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

/**
 * Badge counts come from the server, for the same reason the client sidebar's
 * do: they are per-user figures and must not be baked into the bundle.
 */
export type StaffCounts = {
  assignedTasks: number;
  unreadMessages: number;
  unreadNotifications: number;
};

const buildSections = (counts: StaffCounts): NavSection[] => [
  {
    items: [
      { href: "/staff", label: "Workspace Overview", icon: LayoutDashboard, exact: true },
      {
        href: "/staff/projects",
        label: "Project Kanban Boards",
        icon: SquareKanban,
        // Zero renders no badge rather than a "0" chip.
        badge: counts.assignedTasks || undefined,
      },
      { href: "/staff/time-tracker", label: "Time Tracker & Logs", icon: Timer },
      { href: "/staff/meetings", label: "Meeting Calendar", icon: CalendarDays },
      { href: "/staff/messages", label: "Messages", icon: MessagesSquare, badge: counts.unreadMessages || undefined },
      { href: "/staff/notifications", label: "Notifications", icon: Bell, badge: counts.unreadNotifications || undefined },
      { href: "/staff/files", label: "Files", icon: FolderOpen },
      { href: "/staff/performance", label: "My Skills & Performance", icon: Monitor },
      { href: "/staff/support", label: "Support", icon: LifeBuoy },
    ],
  },
];

const departments = ["Engineering", "SEO & Growth", "Paid Media", "Design"];

export function StaffSidebar({
  user,
  counts,
}: {
  user: SidebarUser | undefined;
  counts: StaffCounts;
}) {
  const [department, setDepartment] = React.useState(departments[0]);

  return (
    <Sidebar
      sub="Obsidian"
      sections={buildSections(counts)}
      user={user ?? { name: "Signed in", role: "Staff" }}
      header={
        <div className="rounded-xl border border-line-subtle bg-surface-sunken p-3">
          <span
            id="department-label"
            className="mb-1 block text-[0.625rem] font-semibold tracking-wide text-ink-tertiary uppercase"
          >
            Department
          </span>
          {/* The source rendered this as a `<div>` with `cursor-pointer`, so it
              could not be reached or operated by keyboard at all. */}
          <Select
            value={department}
            onValueChange={(value) => setDepartment(String(value))}
          >
            <SelectTrigger
              aria-labelledby="department-label"
              size="sm"
              className="border-0 bg-transparent px-0 hover:border-0 focus-visible:ring-0"
            >
              <span className="flex items-center gap-2">
                <Cog className="size-4 text-ink-tertiary" aria-hidden />
                <SelectValue />
              </span>
            </SelectTrigger>
            <SelectContent>
              {departments.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      }
      footer={
        <div className="flex flex-col gap-1">
          <Button className="w-full rounded-xl" render={<Link href="/staff/projects" />}>
            <Plus />
            New Project
          </Button>
          {/* Both present in the design's rail and missing from this one. */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            render={<Link href="/staff/settings" />}
          >
            <Settings />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            render={<Link href="/staff/support" />}
          >
            <LifeBuoy />
            Support
          </Button>
        </div>
      }
    />
  );
}
