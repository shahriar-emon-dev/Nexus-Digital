import type { Metadata } from "next";

import { getStaffWorkspace } from "@/lib/supabase/staff-workspace";
import { timeTotals } from "@/lib/supabase/time-actions";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Skills & Performance" };

const hours = (minutes: number) => {
  if (minutes === 0) return "0h";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`;
};

/**
 * Was a placeholder.
 *
 * Deliberately narrow: this shows what the database actually knows about the
 * signed-in person — their recorded skills, their logged time, their open and
 * completed tasks. There is no performance score, no ranking, and no
 * utilisation percentage, because nothing here measures those and a number in
 * this position would be read as an assessment.
 */
export default async function StaffPerformancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [workspace, totals] = await Promise.all([getStaffWorkspace(), timeTotals()]);

  const [{ data: profile }, { count: completed }] = await Promise.all([
    user
      ? supabase
          .from("staff_profiles")
          .select("display_role, department, skills, seniority, weekly_capacity_hours")
          .eq("id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? supabase
          .from("project_tasks")
          .select("id", { count: "exact", head: true })
          .eq("assignee_id", user.id)
          .eq("column_id", "done")
      : Promise.resolve({ count: 0 }),
  ]);

  const skills = (profile?.skills as string[] | null) ?? [];

  return (
    <>
      <DashboardHeader
        title="Skills & Performance"
        description="What the system records about your work. Only you and staff managers can see it."
        breadcrumbs={[{ label: "Staff", href: "/staff" }, { label: "Performance" }]}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Open tasks", value: String(workspace.tasks.length) },
            { label: "Completed tasks", value: String(completed ?? 0) },
            { label: "Logged this week", value: hours(totals.weekMinutes) },
            { label: "Logged this month", value: hours(totals.monthMinutes) },
          ].map((card) => (
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

        <Card variant="glass" className="gap-4 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-semibold text-ink">Your profile</h2>
          {profile ? (
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                  Role
                </dt>
                <dd className="mt-1 text-ink">{profile.display_role}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                  Department
                </dt>
                <dd className="mt-1 text-ink">{profile.department ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                  Seniority
                </dt>
                <dd className="mt-1 text-ink">{profile.seniority ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                  Weekly capacity
                </dt>
                <dd data-tabular className="mt-1 text-ink">
                  {profile.weekly_capacity_hours ? `${profile.weekly_capacity_hours}h` : "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-ink-tertiary">
              You do not have a staff profile yet. An administrator creates one from the staff
              roster.
            </p>
          )}
        </Card>

        <Card variant="glass" className="gap-4 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-semibold text-ink">Skills</h2>
          {skills.length === 0 ? (
            <p className="text-ink-tertiary">
              No skills recorded. Ask an administrator to add them to your staff profile.
            </p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li key={skill}>
                  <Badge variant="outline">{skill}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
