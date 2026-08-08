import Link from "next/link";
import { MessagesSquare } from "lucide-react";

import { cn } from "@/lib/utils";
import { scheduleElapsed, type PortalProject } from "@/lib/client-portal";
import type { PersonDirectory } from "@/lib/supabase/staff-queries";
import { AvatarGroup } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/**
 * Budget and schedule rail.
 *
 * The design pinned this `fixed right-10 top-32`, which overlaps the content
 * column at any width where the viewport is narrow enough to matter. It is a
 * sticky grid column here instead, so it scrolls with the page and never sits
 * on top of the board.
 */
export function ProjectPulse({
  project,
  people,
}: {
  project: PortalProject;
  /** Resolved on the server; see getPeopleDirectory for why. */
  people: PersonDirectory;
}) {
  const budgetPct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
  const schedule = scheduleElapsed(project);

  const team = project.teamIds
    .map((id) => people[id])
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .map((m) => ({ name: m.name }));

  return (
    <div className="flex flex-col gap-6 xl:sticky xl:top-24">
      <Card variant="glass" className="gap-6 rounded-2xl p-6">
        <h2 className="text-[0.8125rem] font-semibold tracking-widest text-brand uppercase">
          Project Pulse
        </h2>

        <Bar
          label="Budget utilisation"
          value={budgetPct}
          barClass="bg-brand"
          readout={
            <>
              <span data-tabular>{money.format(project.budgetSpent)}</span>
              <span className="text-ink-tertiary">
                {" / "}
                <span data-tabular>{money.format(project.budgetTotal)}</span>
              </span>
            </>
          }
        />

        <Bar
          label="Schedule elapsed"
          value={schedule.percent}
          barClass="bg-ion"
          readout={
            <span data-tabular>
              {schedule.days} of {schedule.total} days
            </span>
          }
        />

        {/* Budget burning faster than the calendar is the one thing worth
            calling out unprompted. */}
        {budgetPct > schedule.percent + 10 && (
          <p className="rounded-lg bg-warning-subtle px-3 py-2 text-[0.8125rem] text-warning">
            Spend is running <span data-tabular>{budgetPct - schedule.percent}</span> points
            ahead of the schedule.
          </p>
        )}
      </Card>

      <Card variant="glass" className="gap-4 rounded-2xl p-6">
        <h2 className="text-[0.8125rem] font-semibold tracking-widest text-brand uppercase">
          Project Team
        </h2>
        <AvatarGroup people={team} size="default" max={3 + project.extraTeam} />
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          render={<Link href="/client/messages" />}
        >
          <MessagesSquare />
          Message project channel
        </Button>
      </Card>
    </div>
  );
}

function Bar({
  label,
  value,
  readout,
  barClass,
}: {
  label: string;
  value: number;
  readout: React.ReactNode;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <p className="text-[0.8125rem] text-ink-tertiary">{label}</p>
        <p className="text-[0.8125rem] font-medium text-ink">{readout}</p>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn("h-full rounded-full", barClass)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
