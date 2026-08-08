import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Settings2, Share2 } from "lucide-react";

import { projectStatusTone } from "@/lib/client-portal";
import { getProjectBySlug, listMilestones, listTasks } from "@/lib/supabase/project-queries";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { ActionFab } from "@/components/client/ActionFab";
import { ProjectPulse } from "@/components/client/ProjectPulse";
import { listDeliverables } from "@/lib/supabase/deliverable-actions";
import { getPeopleDirectory } from "@/lib/supabase/staff-queries";
import { ProjectTabs } from "./ProjectTabs";

type Params = { params: { id: string } };

// No generateStaticParams: projects are per-tenant and RLS-scoped, so there is
// no build-time set to prerender. Every request resolves the caller's own.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const project = await getProjectBySlug(params.id);
  return { title: project ? project.name : "Project not found" };
}

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ClientProjectDetailPage({ params }: Params) {
  // RLS makes an out-of-tenant slug indistinguishable from a missing one, which
  // is the correct answer: a client must not be able to probe for the existence
  // of another organisation's project.
  const project = await getProjectBySlug(params.id);
  if (!project) notFound();

  // The header quotes the final milestone's date when there is one, so it can
  // never disagree with the bottom of the roadmap.
  const [milestones, tasks, deliverables, people] = await Promise.all([
    listMilestones(params.id),
    listTasks(params.id),
    listDeliverables(),
    getPeopleDirectory(),
  ]);

  // Only deliverables that are actually attached to a task on this board, so a
  // review link never points at something belonging to a different project.
  const deliverableIdByTask = Object.fromEntries(
    deliverables
      .filter((d) => d.task_id)
      .map((d) => [d.task_id as string, d.id])
  );
  const completion = milestones.at(-1)?.date ?? project.targetEnd;
  const live = project.status === "Active";

  return (
    <>
      <DashboardHeader
        title={project.name}
        titleAs="p"
        breadcrumbs={[
          { label: "Portal", href: "/client" },
          { label: "Projects", href: "/client/projects" },
          { label: project.name },
        ]}
      />

      <div className="flex flex-col gap-10 px-5 py-10 lg:px-10">
        {/* ── Project header ─────────────────────────────────────────────── */}
        <header className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="min-w-0">
            <p className="mb-3 font-mono text-[0.8125rem] tracking-wider text-ink-tertiary uppercase">
              {project.id}
            </p>
            <h1 className="font-heading text-[2.5rem] leading-[1.1] font-bold tracking-tight text-balance text-ink md:text-[3rem]">
              {project.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <Badge
                variant={projectStatusTone[project.status]}
                className="gap-2 tracking-wider uppercase"
              >
                <span className="relative flex size-2" aria-hidden>
                  {live && (
                    <span className="absolute inset-0 animate-ping rounded-full bg-current opacity-70 motion-reduce:animate-none" />
                  )}
                  <span className="relative size-2 rounded-full bg-current" />
                </span>
                {project.status}
              </Badge>
              <span className="text-[0.8125rem] text-ink-tertiary">{project.stage}</span>
              <span className="hidden h-4 w-px bg-line md:block" aria-hidden />
              <span className="text-[0.8125rem] text-ink-tertiary">
                Est. completion{" "}
                <time data-tabular dateTime={completion} className="text-ink-secondary">
                  {longDate.format(new Date(completion))}
                </time>
              </span>
            </div>
          </div>

          <div className="flex shrink-0 flex-wrap gap-3">
            <Button variant="outline" render={<Link href="/client/settings" />}>
              <Share2 />
              Share access
            </Button>
            <Button
              className="shadow-[0_0_20px_var(--brand-glow)] transition-transform hover:scale-105"
              render={<Link href="/client/settings" />}
            >
              <Settings2 />
              Project settings
            </Button>
          </div>
        </header>

        <p className="max-w-3xl text-lg leading-relaxed text-ink-secondary">
          {project.description}
        </p>

        {/* ── Tabs + pulse rail ──────────────────────────────────────────────
            The rail is a real grid column rather than the design's fixed
            overlay, so it can never sit on top of the board. */}
        <div className="grid grid-cols-1 gap-10 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0">
            <ProjectTabs
              projectId={project.id}
              milestones={milestones}
              tasks={tasks}
              people={people}
              deliverableIdByTask={deliverableIdByTask}
            />
          </div>

          <aside aria-label="Project pulse">
            <ProjectPulse project={project} people={people} />
          </aside>
        </div>
      </div>

      <ActionFab label="Comment on this project" href="/client/messages" icon="comment" />
    </>
  );
}
