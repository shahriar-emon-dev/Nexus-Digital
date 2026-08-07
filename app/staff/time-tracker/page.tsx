import type { Metadata } from "next";

import { listTimeEntries, timeTotals } from "@/lib/supabase/time-actions";
import { listProjectOptions } from "@/lib/supabase/project-queries";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { TimeTrackerClient } from "./TimeTrackerClient";

export const metadata: Metadata = { title: "Time Tracker" };

const hours = (minutes: number) => {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/**
 * Was a placeholder. Time entries are recorded against the signed-in user only
 * — the insert policy pins `profile_id`, so nobody can log hours in somebody
 * else's name even by crafting the request.
 *
 * There is deliberately no utilisation percentage here. That would need a
 * contracted weekly capacity to divide by, and inventing one is how "93.3%
 * utilisation" ended up on a dashboard.
 */
export default async function StaffTimeTrackerPage() {
  const [entries, totals, projects] = await Promise.all([
    listTimeEntries(30),
    timeTotals(),
    listProjectOptions(),
  ]);

  const cards = [
    { label: "Today", value: hours(totals.todayMinutes) },
    { label: "Last 7 days", value: hours(totals.weekMinutes) },
    { label: "Last 30 days", value: hours(totals.monthMinutes) },
  ];

  return (
    <>
      <DashboardHeader
        title="Time Tracker"
        description="Hours you have logged. Only you and the people who manage staff records can see them."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Time Tracker" }]}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-5 py-6 lg:px-8">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {cards.map((card) => (
            <Card key={card.label} variant="glass" className="rounded-2xl p-5">
              <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                {card.label}
              </dt>
              <dd
                data-tabular
                className="mt-1 font-heading text-[1.75rem] leading-none font-bold text-ink"
              >
                {card.value}
              </dd>
            </Card>
          ))}
        </dl>

        {totals.byProject.length > 0 && (
          <Card variant="glass" className="rounded-2xl p-6">
            <h2 className="mb-4 font-heading text-xl font-semibold text-ink">By project</h2>
            <dl className="flex flex-col gap-3">
              {totals.byProject.map((row) => (
                <div key={row.project} className="flex items-baseline justify-between gap-4">
                  <dt className="text-[0.875rem] text-ink-secondary">{row.project}</dt>
                  <dd data-tabular className="text-[0.875rem] font-medium text-ink">
                    {hours(row.minutes)}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>
        )}

        <TimeTrackerClient entries={entries} projects={projects} />
      </div>
    </>
  );
}
