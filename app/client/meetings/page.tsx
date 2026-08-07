import Link from "next/link";
import type { Metadata } from "next";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  FileText,
  ListChecks,
  PlayCircle,
  Video,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { meetingKindTone } from "@/lib/portal-tones";
import { meetingBuckets, type Meeting } from "@/lib/supabase/meeting-actions";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Meetings" };

const dayFormat = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});
const timeFormat = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

const attendeesOf = (meeting: Meeting) => meeting.attendees.map((a) => ({ name: a.name }));

/** Whole days until a timestamp; negative once it has passed. */
const daysUntil = (iso: string) =>
  Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);

const relativeDay = (iso: string) => {
  const days = daysUntil(iso);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days > 1 && days < 7) return `In ${days} days`;
  return null;
};

export default async function ClientMeetingsPage() {
  const { upcoming, past, next: nextMeeting, stats: meetingStats } = await meetingBuckets();
  const rest = upcoming.slice(1);
  const countdown = nextMeeting ? daysUntil(nextMeeting.starts_at) : 0;

  return (
    <>
      <DashboardHeader
        title="Meetings"
        titleAs="p"
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Meetings" }]}
      />

      <div className="flex flex-col gap-10 px-5 py-10 lg:px-10">
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
              Meetings
            </h1>
            <p className="mt-2 text-ink-tertiary">
              <span data-tabular>{meetingStats.upcoming}</span> scheduled ·{" "}
              <span data-tabular>{Math.round(meetingStats.totalMinutes / 60)}</span> hours ·{" "}
              <span data-tabular>{past.length}</span> with recaps
            </p>
          </div>
          {/* TODO: open the scheduler once the meetings API exists. */}
          <Button variant="outline" render={<Link href="/client/messages" />}>
            <CalendarPlus />
            Request a meeting
          </Button>
        </header>

        {/* ── Next up ───────────────────────────────────────────────────── */}
        {nextMeeting ? (
        <Card
          variant="glass"
          className="beam-rotate flex-col justify-between gap-8 rounded-3xl p-8 lg:flex-row lg:items-center"
        >
          <div className="relative z-10 flex min-w-0 flex-col gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant={meetingKindTone[nextMeeting.kind]}>{nextMeeting.kind}</Badge>
              <span className="flex items-center gap-2 text-[0.8125rem] text-ink-tertiary">
                <span className="relative flex size-2" aria-hidden>
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand opacity-70 motion-reduce:animate-none" />
                  <span className="relative size-2 rounded-full bg-brand" />
                </span>
                Next up
              </span>
            </div>

            <h2 className="font-heading text-[2rem] leading-tight font-bold text-balance text-ink">
              {nextMeeting.title}
            </h2>

            <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-ink-secondary">
              <span className="flex items-center gap-2">
                <CalendarDays className="size-4 shrink-0 text-brand" aria-hidden />
                <time dateTime={nextMeeting.starts_at} data-tabular>
                  {relativeDay(nextMeeting.starts_at) ??
                    dayFormat.format(new Date(nextMeeting.starts_at))}
                  {" · "}
                  {timeFormat.format(new Date(nextMeeting.starts_at))} UTC
                </time>
              </span>
              <span className="flex items-center gap-2">
                <Clock className="size-4 shrink-0 text-brand" aria-hidden />
                <span data-tabular>{nextMeeting.duration_minutes}</span> minutes
              </span>
            </p>

            <ul className="flex flex-col gap-1.5">
              {nextMeeting.agenda.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-[0.8125rem] text-ink-tertiary"
                >
                  <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-brand" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative z-10 flex shrink-0 flex-col items-start gap-4 lg:items-end">
            <AvatarGroup
              people={attendeesOf(nextMeeting)}
              size="default"
              max={4}
            />
            <Button
              size="xl"
              className="rounded-xl px-10 shadow-[0_0_24px_var(--brand-glow)] transition-transform hover:scale-105"
              render={<Link href="/client/messages" />}
            >
              <Video />
              Join video room
            </Button>
            <p className="text-[0.75rem] text-ink-tertiary">
              {countdown <= 0
                ? "The room is open now."
                : countdown === 1
                  ? "Opens 10 minutes before the start."
                  : `Opens in ${countdown} days.`}
            </p>
          </div>
        </Card>
        ) : (
          /* A real empty state. Everything above assumed a meeting always
             existed, because the static array always had one. */
          <Card variant="glass" className="items-center gap-3 rounded-3xl p-10 text-center">
            <CalendarDays className="size-8 text-ink-tertiary" aria-hidden />
            <h2 className="font-heading text-xl font-semibold text-ink">
              Nothing scheduled
            </h2>
            <p className="max-w-md text-ink-tertiary">
              When your team books a review, workshop or handover it will appear here
              with its agenda and attendees.
            </p>
          </Card>
        )}

        {/* ── Scheduled ─────────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <section className="flex flex-col gap-5">
            <h2 className="font-heading text-xl font-semibold text-ink">Also scheduled</h2>
            <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {rest.map((meeting) => (
                <li key={meeting.id}>
                  <ScheduledCard meeting={meeting} />
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Past ──────────────────────────────────────────────────────── */}
        <section className="flex flex-col gap-5 pb-6">
          <h2 className="font-heading text-xl font-semibold text-ink">Past meetings</h2>

          {past.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-ink-tertiary">
              No meetings have taken place yet.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {past.map((meeting) => (
                <li key={meeting.id}>
                  <PastCard meeting={meeting} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function ScheduledCard({ meeting }: { meeting: Meeting }) {
  const project = meeting.projectName
    ? { name: meeting.projectName, href: `/client/projects/${meeting.projectSlug ?? ""}` }
    : undefined;
  const days = daysUntil(meeting.starts_at);

  return (
    <Card variant="glass" lift className="h-full gap-4 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <Badge variant={meetingKindTone[meeting.kind]} size="sm">
          {meeting.kind}
        </Badge>
        <span data-tabular className="text-[0.75rem] text-ink-tertiary">
          in {days} {days === 1 ? "day" : "days"}
        </span>
      </div>

      <h3 className="font-heading text-lg leading-snug font-semibold text-ink">
        {meeting.title}
      </h3>

      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.8125rem] text-ink-tertiary">
        <time dateTime={meeting.starts_at} data-tabular>
          {dayFormat.format(new Date(meeting.starts_at))} ·{" "}
          {timeFormat.format(new Date(meeting.starts_at))} UTC
        </time>
        <span aria-hidden>·</span>
        <span data-tabular>{meeting.duration_minutes} min</span>
      </p>

      {project && (
        <Link
          href={project.href}
          className="w-fit rounded-sm text-[0.8125rem] text-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
        >
          {project.name}
        </Link>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-subtle pt-4">
        <AvatarGroup
          people={attendeesOf(meeting)}
          size="sm"
          max={4}
        />
        <Button variant="outline" size="sm" render={<Link href="/client/messages" />}>
          Details
        </Button>
      </div>
    </Card>
  );
}

function PastCard({ meeting }: { meeting: Meeting }) {
  const project = meeting.projectName
    ? { name: meeting.projectName, href: `/client/projects/${meeting.projectSlug ?? ""}` }
    : undefined;

  return (
    <Card variant="glass" lift className="gap-5 rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-3">
            <Badge variant="default" size="sm">
              {meeting.kind}
            </Badge>
            <time
              dateTime={meeting.starts_at}
              data-tabular
              className="text-[0.75rem] text-ink-tertiary"
            >
              {dayFormat.format(new Date(meeting.starts_at))}
            </time>
            {project && (
              <Link
                href={project.href}
                className="rounded-sm text-[0.75rem] text-brand underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                {project.name}
              </Link>
            )}
          </div>
          <h3 className="font-heading text-lg leading-snug font-semibold text-ink">
            {meeting.title}
          </h3>
        </div>

        {meeting.recap && (
          // TODO: link to the stored recording once media hosting exists.
          <Button variant="outline" size="sm" className="shrink-0">
            <PlayCircle />
            Recording · <span data-tabular>{meeting.recap.recordingMinutes}</span> min
          </Button>
        )}
      </div>

      {meeting.recap && (
        <>
          <p className="flex items-start gap-2 text-[0.875rem] text-ink-secondary">
            <FileText className="mt-0.5 size-4 shrink-0 text-ink-tertiary" aria-hidden />
            {meeting.recap.summary}
          </p>

          {meeting.recap.actions.length > 0 && (
            <div>
              <p className="mb-2 flex items-center gap-2 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
                <ListChecks className="size-3.5" aria-hidden />
                Actions agreed
              </p>
              <ul className="flex flex-col gap-1.5">
                {meeting.recap.actions.map((action) => (
                  <li
                    key={action}
                    className={cn(
                      "flex items-start gap-2 rounded-lg bg-surface-sunken px-3 py-2",
                      "text-[0.8125rem] text-ink-secondary"
                    )}
                  >
                    <span aria-hidden className="mt-1.5 size-1 shrink-0 rounded-full bg-ion" />
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
