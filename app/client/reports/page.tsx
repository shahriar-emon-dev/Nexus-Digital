import type { Metadata } from "next";
import Link from "next/link";
import { FileBarChart } from "lucide-react";

import { listProjects } from "@/lib/supabase/project-queries";
import { money } from "@/lib/format";
import { getBillingSummary } from "@/lib/supabase/client-billing";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";

export const metadata: Metadata = { title: "Reports" };

/**
 * A delivery summary across the client's projects.
 *
 * Was a placeholder. Every figure is counted from the caller's own rows — there
 * is no exported PDF or scheduled report, because nothing generates one, and a
 * "Download report" button that produced nothing would be the same defect this
 * work has been removing everywhere else.
 */
export default async function ClientReportsPage() {
  const supabase = await createClient();

  const [projects, billing, { data: milestones }] = await Promise.all([
    listProjects(),
    getBillingSummary(),
    supabase.from("project_milestones").select("id, status, due_date, project_id"),
  ]);

  const all = milestones ?? [];
  const done = all.filter((m) => m.status === "done").length;
  const active = projects.filter((p) => p.status === "Active");
  const averageProgress =
    active.length === 0
      ? null
      : Math.round(active.reduce((sum, p) => sum + p.progress, 0) / active.length);

  return (
    <>
      <DashboardHeader
        title="Reports"
        description="Delivery and billing across your account, counted from your own records."
        breadcrumbs={[{ label: "Portal", href: "/client" }, { label: "Reports" }]}
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 py-6 lg:px-8">
        {projects.length === 0 ? (
          <Card variant="glass" className="items-center gap-3 rounded-2xl p-12 text-center">
            <FileBarChart className="size-8 text-ink-tertiary" aria-hidden />
            <h2 className="font-heading text-xl font-semibold text-ink">Nothing to report yet</h2>
            <p className="max-w-sm text-ink-tertiary">
              Once a project is underway this page summarises its progress, milestones and
              billing.
            </p>
          </Card>
        ) : (
          <>
            <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: "Projects", value: String(projects.length) },
                { label: "Active", value: String(active.length) },
                {
                  label: "Milestones done",
                  value: all.length > 0 ? `${done}/${all.length}` : "—",
                },
                { label: "Outstanding", value: money.format(billing.outstanding) },
              ].map((card) => (
                <Card key={card.label} variant="glass" className="rounded-2xl p-5">
                  <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                    {card.label}
                  </dt>
                  <dd
                    data-tabular
                    className="mt-1 font-heading text-[1.5rem] leading-none font-bold text-ink"
                  >
                    {card.value}
                  </dd>
                </Card>
              ))}
            </dl>

            <Card variant="glass" className="gap-4 rounded-2xl p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-heading text-xl font-semibold text-ink">Progress by project</h2>
                {averageProgress !== null && (
                  <p className="text-[0.8125rem] text-ink-tertiary">
                    Average across active work:{" "}
                    <span data-tabular className="font-medium text-ink">
                      {averageProgress}%
                    </span>
                  </p>
                )}
              </div>

              <ul className="flex flex-col gap-4">
                {projects.map((project) => (
                  <li key={project.id} className="flex flex-col gap-1.5">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link
                        href={project.href}
                        className="rounded-sm font-medium text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none"
                      >
                        {project.name}
                      </Link>
                      <span className="flex items-center gap-2">
                        <Badge variant="outline" size="sm">
                          {project.status}
                        </Badge>
                        <span data-tabular className="text-[0.8125rem] font-medium text-ink">
                          {project.progress}%
                        </span>
                      </span>
                    </div>
                    <div
                      className="h-1.5 overflow-hidden rounded-full bg-line"
                      role="progressbar"
                      aria-label={`${project.name} progress`}
                      aria-valuenow={project.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full rounded-full bg-brand"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>

            <Button variant="outline" className="w-fit rounded-xl" render={<Link href="/client/support" />}>
              Ask for a written report
            </Button>
          </>
        )}
      </div>
    </>
  );
}
