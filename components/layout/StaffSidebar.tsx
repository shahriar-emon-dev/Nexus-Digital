"use client";

import * as React from "react";
import {
  CalendarDays,
  Cog,
  LayoutDashboard,
  Monitor,
  Plus,
  SquareKanban,
  Timer,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sidebar, type NavSection, type SidebarUser } from "./Sidebar";

const sections: NavSection[] = [
  {
    items: [
      { href: "/staff", label: "Workspace Overview", icon: LayoutDashboard, exact: true },
      { href: "/staff/projects", label: "Project Kanban Boards", icon: SquareKanban },
      { href: "/staff/time-tracker", label: "Time Tracker & Logs", icon: Timer },
      { href: "/staff/meetings", label: "Meeting Calendar", icon: CalendarDays },
      { href: "/staff/performance", label: "My Skills & Performance", icon: Monitor },
    ],
  },
];

const departments = ["Engineering", "SEO & Growth", "Paid Media", "Design"];

const defaultUser: SidebarUser = { name: "Alex Mercer", role: "Senior Specialist" };

export function StaffSidebar({ user = defaultUser }: { user?: SidebarUser }) {
  const [department, setDepartment] = React.useState(departments[0]);

  return (
    <Sidebar
      sub="Obsidian"
      sections={sections}
      user={user}
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
        <Button className="w-full rounded-xl">
          <Plus />
          New Project
        </Button>
      }
    />
  );
}
