import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { meetingKindTone } from "@/lib/portal-tones";
import { meetingBuckets } from "@/lib/supabase/meeting-actions";
import { listProjectOptions } from "@/lib/supabase/project-queries";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AvatarGroup } from "@/components/ui/avatar";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MeetingScheduler } from "./MeetingScheduler";

export const metadata: Metadata = { title: "Meetings" };

const when = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** Was a placeholder with no meetings table. Staff can schedule from here. */
export default async function StaffMeetingsPage() {
  const [{ upcoming, past, stats }, projects] = await Promise.all([
    meetingBuckets(),
    listProjectOptions(),
  ]);

  return (
    <>
      <DashboardHeader
        title="Meetings"
        description="Sessions you are part of, and anything on your projects."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Meetings" }]}
      />

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Card variant="glass" className="rounded-2xl p-5">
            <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              Upcoming
            </dt>
            <dd data-tabular className="mt-1 font-heading text-[1.75rem] font-bold text-ink">
              {stats.upcoming}
            </dd>
          </Card>
          <Card variant="glass" className="rounded-2xl p-5">
            <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              Next 7 days
            </dt>
            <dd data-tabular className="mt-1 font-heading text-[1.75rem] font-bold text-ink">
              {stats.thisWeek}
            </dd>
          </Card>
          <Card variant="glass" className="rounded-2xl p-5">
            <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
              Scheduled hours
            </dt>
            <dd data-tabular className="mt-1 font-heading text-[1.75rem] font-bold text-ink">
              {Math.round(stats.totalMinutes / 60)}
            </dd>
          </Card>
        </dl>

        <MeetingScheduler projects={projects} />

        <section className="flex flex-col gap-3">
          <h2 className="font-heading text-xl font-semibold text-ink">Upcoming</h2>
          {upcoming.length === 0 ? (
            <Card variant="glass" className="items-center gap-2 rounded-2xl p-10 text-center">
              <CalendarDays className="size-7 text-ink-tertiary" aria-hidden />
              <p className="text-ink-tertiary">Nothing scheduled.</p>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              {upcoming.map((m) => (
                <li key={m.id}>
                  <Card variant="glass" className="flex-row flex-wrap items-center gap-4 rounded-xl p-4">
                    <Badge variant={meetingKindTone[m.kind]}>{m.kind}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{m.title}</p>
                      <p className="text-[0.75rem] text-ink-tertiary">
                        <time dateTime={m.starts_at} suppressHydrationWarning>
                          {when.format(new Date(m.starts_at))}
                        </time>
                        {" · "}
                        {m.duration_minutes} min
                        {m.projectName && ` · ${m.projectName}`}
                      </p>
                    </div>
                    <AvatarGroup people={m.attendees.map((a) => ({ name: a.name }))} size="sm" max={4} />
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

        {past.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="font-heading text-xl font-semibold text-ink">Past</h2>
            <ul className="flex flex-col gap-2">
              {past.slice(0, 10).map((m) => (
                <li key={m.id}>
                  <Card variant="glass" className="flex-row flex-wrap items-center gap-4 rounded-xl p-4 opacity-75">
                    <Badge variant="outline">{m.kind}</Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-ink">{m.title}</p>
                      <p className="text-[0.75rem] text-ink-tertiary">
                        <time dateTime={m.starts_at} suppressHydrationWarning>
                          {when.format(new Date(m.starts_at))}
                        </time>
                      </p>
                    </div>
                    {m.recap && <Badge variant="success" size="sm">Recap</Badge>}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-[0.8125rem] text-ink-tertiary">
          Clients see the same meetings on{" "}
          <Link href="/client/meetings" className="text-brand underline-offset-4 hover:underline">
            their own calendar
          </Link>
          .
        </p>
      </div>
    </>
  );
}
