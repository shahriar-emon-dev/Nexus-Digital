import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, CalendarDays, CheckCircle2, Clock, Video } from "lucide-react";

import { cn } from "@/lib/utils";
import { getStaffWorkspace } from "@/lib/supabase/staff-workspace";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TeamPresence } from "@/components/shared/TeamPresence";

export const metadata: Metadata = { title: "Workspace Overview" };

/**
 * The staff landing page.
 *
 * Everything here used to be a literal: seven invented teammates, two tasks
 * against clients that do not exist, "Systems Online, Alex", "6.5h Daily
 * Hours", "3 critical sprints finishing this week", an "Architecture Sync in 45
 * mins", and a velocity panel reading 142 commits / 28 PRs / 9 deployments.
 * The file imported nothing from the database.
 *
 * The Sprint Velocity panel is gone rather than rebuilt: nothing in this system
 * records commits, pull requests or deployments, so there is no honest version
 * of it. Refilling it with different invented numbers would be the same bug.
 */

const hours = (minutes: number) => {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});

export default async function StaffOverviewPage() {
  const { displayName, tasks, todayMinutes, nextMeeting, team, unreadNotifications } =
    await getStaffWorkspace();

  const startsIn = nextMeeting
    ? Math.round((new Date(nextMeeting.startsAt).getTime() - Date.now()) / 60_000)
    : null;

  return (
    <>
      <DashboardHeader
        title="Nexus Workspace"
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Overview" }]}
        presence={team.length > 0 ? <TeamPresence people={team} /> : undefined}
        actions={
          <Button size="sm" render={<Link href="/staff/time-tracker" />}>
            <Clock />
            Log time
          </Button>
        }
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h2 className="mb-2 font-heading text-[3rem] leading-[1.2] font-bold tracking-tight text-ink">
              Systems Online, <span className="text-brand">{displayName}.</span>
            </h2>
            <p className="text-lg text-ink-tertiary">
              {tasks.length === 0
                ? "Nothing is assigned to you right now."
                : `${tasks.length} open ${tasks.length === 1 ? "task" : "tasks"} assigned to you.`}
              {unreadNotifications > 0 && (
                <>
                  {" "}
                  <Link
                    href="/staff/notifications"
                    className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none"
                  >
                    {unreadNotifications} unread{" "}
                    {unreadNotifications === 1 ? "notification" : "notifications"}.
                  </Link>
                </>
              )}
            </p>
          </div>

          <dl className="flex gap-4">
            <Card variant="glass" className="items-center rounded-2xl px-6 py-4">
              <dd data-tabular className="font-heading text-2xl font-bold text-brand">
                {hours(todayMinutes)}
              </dd>
              <dt className="text-[0.625rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Logged today
              </dt>
            </Card>
            <Card variant="glass" className="items-center rounded-2xl px-6 py-4">
              <dd data-tabular className="font-heading text-2xl font-bold text-ion">
                {tasks.length}
              </dd>
              <dt className="text-[0.625rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Open tasks
              </dt>
            </Card>
          </dl>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* ── Next meeting ─────────────────────────────────────────────── */}
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
              {/* Only when it is genuinely soon. The old badge said "In 45 mins"
                  unconditionally, for a meeting that did not exist. */}
              {startsIn !== null && startsIn <= 120 && (
                <Badge variant="outline">
                  {startsIn <= 0 ? "Starting now" : `In ${startsIn} min`}
                </Badge>
              )}
            </div>

            {nextMeeting ? (
              <>
                <h3 className="mb-1 font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                  {nextMeeting.title}
                </h3>
                <p className="mb-6 text-ink-tertiary">
                  {nextMeeting.projectName ?? "No linked project"}
                </p>

                <p className="flex items-center gap-4 border-t border-line-subtle py-3">
                  <Clock className="size-5 shrink-0 text-brand" aria-hidden />
                  <time
                    dateTime={nextMeeting.startsAt}
                    data-tabular
                    className="text-sm font-medium text-ink"
                    suppressHydrationWarning
                  >
                    {timeFormat.format(new Date(nextMeeting.startsAt))} ·{" "}
                    {nextMeeting.durationMinutes} min
                  </time>
                </p>

                <Button
                  variant="outline"
                  className="mt-4 w-full rounded-xl"
                  render={<Link href="/staff/meetings" />}
                >
                  Open meeting
                </Button>
              </>
            ) : (
              <>
                <h3 className="mb-1 font-heading text-2xl leading-[1.3] font-semibold text-ink">
                  Nothing scheduled
                </h3>
                <p className="mb-6 text-ink-tertiary">
                  Your next meeting will appear here once one is booked.
                </p>
                <Button
                  variant="outline"
                  className="mt-auto w-full rounded-xl"
                  render={<Link href="/staff/meetings" />}
                >
                  <CalendarDays />
                  Schedule one
                </Button>
              </>
            )}
          </Card>

          {/* ── Assigned tasks ───────────────────────────────────────────── */}
          <Card
            variant="glass"
            className="border-beam col-span-12 rounded-3xl p-6 lg:col-span-8"
          >
            <div className="mb-8 flex items-center justify-between gap-3">
              <h3 className="font-heading text-[2rem] leading-[1.3] font-semibold text-ink">
                Assigned Tasks
              </h3>
              <Button variant="link" size="sm" render={<Link href="/staff/projects" />}>
                View board
                <ArrowRight />
              </Button>
            </div>

            {tasks.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <CheckCircle2 className="size-8 text-ink-tertiary" aria-hidden />
                <p className="text-ink-tertiary">
                  Nothing is assigned to you. New work appears here the moment somebody
                  puts your name on a task.
                </p>
              </div>
            ) : (
              <ul className="flex flex-col gap-4">
                {tasks.map((task) => (
                  <li
                    key={task.id}
                    className={cn(
                      "flex flex-wrap items-center gap-4 rounded-2xl border border-transparent bg-surface-sunken/70 p-4",
                      "transition-colors duration-(--duration-fast) hover:border-line hover:bg-surface-sunken"
                    )}
                  >
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-line-subtle bg-canvas text-[0.625rem] font-bold tracking-wide text-brand uppercase">
                      {(task.discipline ?? "task").slice(0, 4)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-medium text-ink">{task.title}</h4>
                      <p className="truncate text-xs text-ink-tertiary">
                        {task.projectName ?? "No project"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {task.priority && (
                        <Badge variant="danger" size="sm">
                          Priority
                        </Badge>
                      )}
                      {task.awaiting_approval && (
                        <Badge variant="warning" size="sm">
                          Awaiting approval
                        </Badge>
                      )}
                      <Badge variant="outline" size="sm" className="capitalize">
                        {task.column_id.replace("-", " ")}
                      </Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
