import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getProjectBySlug, listMilestones, listTasks } from "@/lib/supabase/project-queries";
import { listProjectFiles } from "@/lib/supabase/file-actions";
import { projectStatusTone } from "@/lib/client-portal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { MilestoneRoadmap } from "@/components/client/MilestoneRoadmap";

type Params = { params: { id: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.id);
  return { title: project ? project.name : "Project not found" };
}

/**
 * A single project, from the staff side. Was a placeholder.
 *
 * The board itself lives at /staff/projects across every project — this is the
 * detail view: schedule, budget, milestones and shared files. RLS scopes the
 * read, so a slug the caller cannot see 404s exactly like one that does not
 * exist.
 */
export default async function StaffProjectDetailPage({ params }: Params) {
  const project = await getProjectBySlug(params.id);
  if (!project) notFound();

  const [milestones, tasks, files] = await Promise.all([
    listMilestones(params.id),
    listTasks(params.id),
    listProjectFiles(),
  ]);

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

  const open = tasks.filter((t) => t.column !== "done").length;
  const projectFiles = files.filter((f) => f.projectName === project.name);

  return (
    <>
      <DashboardHeader
        title={project.name}
        titleAs="p"
        breadcrumbs={[
          { label: "Staff", href: "/staff" },
          { label: "Board", href: "/staff/projects" },
          { label: project.name },
        ]}
        actions={<Badge variant={projectStatusTone[project.status]}>{project.status}</Badge>}
      />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-5 py-6 lg:px-8">
        <Button variant="ghost" size="sm" className="w-fit" render={<Link href="/staff/projects" />}>
          <ArrowLeft />
          Back to board
        </Button>

        <div>
          <h1 className="font-heading text-[2rem] leading-tight font-bold text-ink">
            {project.name}
          </h1>
          {project.description && (
            <p className="mt-2 max-w-2xl text-ink-tertiary">{project.description}</p>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            { label: "Progress", value: `${project.progress}%` },
            { label: "Open tasks", value: String(open) },
            { label: "Budget", value: money.format(project.budgetTotal) },
            { label: "Spent", value: money.format(project.budgetSpent) },
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

        <Card variant="glass" className="gap-3 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-semibold text-ink">Schedule</h2>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Started
              </dt>
              <dd data-tabular className="mt-1 text-ink">
                {project.startDate || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-[0.6875rem] font-bold tracking-wide text-ink-tertiary uppercase">
                Target end
              </dt>
              <dd data-tabular className="mt-1 text-ink">
                {project.targetEnd || "—"}
              </dd>
            </div>
          </dl>
        </Card>

        {milestones.length > 0 && <MilestoneRoadmap milestones={milestones} />}

        <Card variant="glass" className="gap-3 rounded-2xl p-6">
          <h2 className="font-heading text-xl font-semibold text-ink">Files</h2>
          {projectFiles.length === 0 ? (
            <p className="text-ink-tertiary">
              Nothing shared on this project yet.{" "}
              <Link
                href="/staff/files"
                className="rounded-sm text-brand underline-offset-4 hover:underline focus-visible:outline-none"
              >
                Upload something
              </Link>
              .
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {projectFiles.map((file) => (
                <li key={file.id}>
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="rounded-sm text-[0.9375rem] text-ink underline-offset-4 hover:text-brand hover:underline focus-visible:outline-none"
                  >
                    {file.name}
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
