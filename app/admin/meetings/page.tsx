import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, CalendarX2, Clock, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/shared/EmptyState";
import { meetingBuckets } from "@/lib/supabase/meeting-actions";
import { listAvailability } from "@/lib/supabase/availability-actions";
import { WEEKDAYS } from "@/lib/weekdays";

export const metadata: Metadata = {
  title: "Meetings",
  description: "Every booking across the agency, and the hours staff are bookable.",
};

/**
 * The admin meetings module.
 *
 * Spec §10.2 lists Meetings as one of the twelve admin nav groups and §7.2
 * specifies what it should do. There was no `/admin/meetings` route at all —
 * the table, the RLS, the participants and `createMeeting` all existed, and the
 * only surfaces reading them were the staff and client portals. An
 * administrator could not see the agency's calendar.
 *
 * Numbers here are derived by `meetingBuckets`, which splits on read rather
 * than storing an "upcoming" flag something would have to keep true.
 */
export default async function AdminMeetingsPage() {
  const [{ upcoming, past, stats }, availability] = await Promise.all([
    meetingBuckets(),
    listAvailability(),
  ]);

  const when = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  const byPerson = new Map<string, typeof availability>();
  for (const rule of availability) {
    const list = byPerson.get(rule.profile_id) ?? [];
    list.push(rule);
    byPerson.set(rule.profile_id, list);
  }

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Meetings" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Meetings
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every booking across the agency. Staff schedule meetings from their own
          workspace; this is the view across all of them.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat icon={CalendarClock} label="Upcoming" value={String(stats.upcoming)} />
        <Stat icon={Clock} label="Next 7 days" value={String(stats.thisWeek)} />
        <Stat
          icon={Users}
          label="Scheduled time"
          value={`${Math.round(stats.totalMinutes / 60)}h`}
        />
      </div>

      <section aria-labelledby="upcoming-heading" className="flex flex-col gap-4">
        <h2 id="upcoming-heading" className="font-heading text-xl font-semibold text-ink">
          Upcoming
        </h2>

        {upcoming.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="Nothing scheduled"
            description="Meetings booked by staff, or converted from an enquiry, appear here."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {upcoming.map((m) => (
              <li key={m.id}>
                <Card variant="glass" className="gap-3 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-ink">{m.title}</p>
                      <p className="text-sm text-ink-tertiary">
                        <span data-tabular>{when.format(new Date(m.starts_at))}</span> ·{" "}
                        <span data-tabular>{m.duration_minutes}</span> min
                        {m.projectName ? ` · ${m.projectName}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge variant="outline">{m.kind}</Badge>
                      <Badge
                        variant={m.status === "Cancelled" ? "danger" : "default"}
                      >
                        {m.status}
                      </Badge>
                    </div>
                  </div>

                  {m.attendees.length > 0 && (
                    <p className="text-xs text-ink-tertiary">
                      {m.attendees.map((a) => a.name).join(" · ")}
                    </p>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="availability-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="availability-heading" className="font-heading text-xl font-semibold text-ink">
            Bookable hours
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-ink-tertiary">
            The windows the public booking page may offer. Staff set their own on{" "}
            <Link href="/staff/settings" className="text-brand hover:underline">
              their settings screen
            </Link>
            ; a visitor never sees a slot outside these.
          </p>
        </div>

        {availability.length === 0 ? (
          <EmptyState
            icon={Clock}
            title="No working hours are configured"
            description="Until somebody publishes bookable hours, /book-meeting records an enquiry rather than offering a calendar — which is the honest behaviour, not a fallback."
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {Array.from(byPerson.entries()).map(([profileId, rules]) => (
              <li key={profileId}>
                <Card variant="glass" className="gap-2 rounded-xl p-4">
                  <ul className="flex flex-col gap-1 text-sm text-ink-secondary">
                    {rules.map((r) => (
                      <li key={r.id} className="flex justify-between gap-3">
                        <span>{WEEKDAYS[r.weekday]}</span>
                        <span data-tabular className="text-ink-tertiary">
                          {String(r.starts_at).slice(0, 5)}–{String(r.ends_at).slice(0, 5)}{" "}
                          {r.timezone}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <section aria-labelledby="past-heading" className="flex flex-col gap-4">
          <h2 id="past-heading" className="font-heading text-xl font-semibold text-ink">
            Past
          </h2>
          <ul className="flex flex-col gap-2">
            {past.slice(0, 20).map((m) => (
              <li
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line-subtle px-4 py-2.5 text-sm"
              >
                <span className="text-ink-secondary">{m.title}</span>
                <span data-tabular className="text-ink-tertiary">
                  {when.format(new Date(m.starts_at))}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CalendarClock;
  label: string;
  value: string;
}) {
  return (
    <Card variant="glass" className="gap-2 rounded-xl p-5">
      <span className="flex items-center gap-2 text-xs tracking-wider text-ink-tertiary uppercase">
        <Icon className="size-4" aria-hidden />
        {label}
      </span>
      <p data-tabular className="font-heading text-2xl font-bold text-ink">
        {value}
      </p>
    </Card>
  );
}
