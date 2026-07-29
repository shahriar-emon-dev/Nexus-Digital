import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BarChart3,
  Clock,
  Terminal,
  Video,
  Zap,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TeamPresence } from "@/components/shared/TeamPresence";
import { SprintVelocity } from "./SprintVelocity";

export const metadata: Metadata = { title: "Workspace Overview" };

const team = [
  { name: "Marcus Vale" },
  { name: "Sarah Quinn" },
  { name: "Chen Liu" },
  { name: "Dez Okafor" },
  { name: "Mira Kaur" },
  { name: "Sam Ellery" },
  { name: "Priya Raman" },
];

type Task = {
  title: string;
  meta: string;
  icon: LucideIcon;
  priority: "High" | "Medium" | "Low";
  progress: number;
};

const tasks: Task[] = [
  {
    title: "Refactor Auth Middleware",
    meta: "OmniPay Global • Security Update",
    icon: Terminal,
    priority: "High",
    progress: 75,
  },
  {
    title: "Dashboard Latency Audit",
    meta: "Nexus Core • Performance",
    icon: BarChart3,
    priority: "Medium",
    progress: 25,
  },
];

const priorityTone = {
  High: { text: "text-danger", bar: "bg-danger" },
  Medium: { text: "text-warning", bar: "bg-warning" },
  Low: { text: "text-ink-tertiary", bar: "bg-line-strong" },
} as const;

const velocityStats = [
  { label: "Commits", value: "142", tone: "text-brand" },
  { label: "PRs Closed", value: "28", tone: "text-ion" },
  { label: "Issues", value: "04", tone: "text-danger" },
  { label: "Deployments", value: "09", tone: "text-ink" },
];

export default function StaffOverviewPage() {
  return (
    <>
      <DashboardHeader
        title="Nexus Workspace"
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Overview" }]}
        presence={<TeamPresence people={team} />}
        actions={
          <Button size="sm">
            <Zap />
            Quick Task
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 lg:px-8">
        {/* Welcome + at-a-glance */}
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 font-heading text-[3rem] leading-[1.2] font-bold tracking-tight text-ink">
              Systems Online, <span className="text-brand">Alex.</span>
            </h2>
            <p className="text-lg text-ink-tertiary">
              You have 3 critical sprints finishing this week.
            </p>
          </div>

          <dl className="flex gap-4">
            <Card variant="glass" className="items-center rounded-2xl px-6 py-4">
              <dd data-tabular className="font-heading text-2xl font-bold text-brand">
                6.5h
              </dd>
              <dt className="text-[0.625rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Daily Hours
              </dt>
            </Card>
            <Card variant="glass" className="items-center rounded-2xl px-6 py-4">
              <dd data-tabular className="font-heading text-2xl font-bold text-ion">
                3
              </dd>
              <dt className="text-[0.625rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Active Tasks
              </dt>
            </Card>
          </dl>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Upcoming meeting */}
          <Card
            variant="glass"
            className="group relative col-span-12 overflow-hidden rounded-3xl p-6 lg:col-span-4"
          >
            <span
              className="pointer-events-none absolute -top-16 -right-16 size-32 rounded-full bg-brand/5 blur-3xl transition-colors duration-(--duration-slow) group-hover:bg-brand/10"
              aria-hidden
            />
            <div className="mb-6 flex items-center justify-between">
              <span className="grid size-10 place-items-center rounded-xl bg-brand/20 text-brand">
                <Video className="size-5" aria-hidden />
              </span>
              <Badge variant="outline">In 45 mins</Badge>
            </div>

            <h3 className="mb-1 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
              Architecture Sync
            </h3>
            <p className="mb-6 text-ink-tertiary">OmniPay Global Re-platforming</p>

            <p className="flex items-center gap-4 border-t border-line-subtle py-3">
              <Clock className="size-5 shrink-0 text-brand" aria-hidden />
              <time data-tabular className="text-sm font-medium text-ink">
                2:00 PM — 3:30 PM
              </time>
            </p>

            <Button variant="outline" className="mt-4 w-full rounded-xl">
              Join Meeting
            </Button>
          </Card>

          {/* Assigned tasks */}
          <Card
            variant="glass"
            className="border-beam col-span-12 rounded-3xl p-6 lg:col-span-8"
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <h3 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                Assigned Tasks
              </h3>
              <Button variant="link" size="sm" render={<Link href="/staff/projects" />}>
                View All
                <ArrowRight />
              </Button>
            </div>

            <ul className="flex flex-col gap-4">
              {tasks.map((task) => {
                const tone = priorityTone[task.priority];
                return (
                  <li
                    key={task.title}
                    className={cn(
                      "flex flex-wrap items-center gap-4 rounded-2xl border border-transparent bg-surface-sunken/70 p-4",
                      "transition-colors duration-(--duration-fast) hover:border-line hover:bg-surface-sunken"
                    )}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-subtle bg-canvas text-brand">
                      <task.icon className="size-5" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-ink">{task.title}</h4>
                      <p className="truncate text-xs text-ink-tertiary">{task.meta}</p>
                    </div>

                    <div className="text-right">
                      <p className={cn("mb-1 text-xs font-bold", tone.text)}>
                        {task.priority} Priority
                      </p>
                      <div
                        className="h-1 w-24 overflow-hidden rounded-full bg-line"
                        role="progressbar"
                        aria-label={`${task.title} progress`}
                        aria-valuenow={task.progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <div
                          className={cn("h-full rounded-full", tone.bar)}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Card>

          {/* Sprint velocity */}
          <Card
            variant="glass"
            className="col-span-12 flex-col items-center gap-12 rounded-3xl p-8 md:flex-row"
          >
            <div className="flex-1">
              <h3 className="mb-4 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                Sprint Velocity
              </h3>
              <p className="mb-8 max-w-md leading-relaxed text-ink-tertiary">
                Your team has increased productivity by 12% this cycle. Key focus: reducing
                technical debt on the Obsidian Framework.
              </p>

              <dl className="grid grid-cols-2 gap-6 sm:grid-cols-4">
                {velocityStats.map((stat) => (
                  <div key={stat.label}>
                    <dt className="mb-1 text-xs font-bold tracking-wide text-ink-tertiary uppercase">
                      {stat.label}
                    </dt>
                    <dd
                      data-tabular
                      className={cn("font-heading text-2xl font-bold", stat.tone)}
                    >
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <SprintVelocity />
          </Card>
        </div>
      </div>
    </>
  );
}
