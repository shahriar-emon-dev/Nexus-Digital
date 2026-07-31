import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Flag,
  LoaderCircle,
  MessagesSquare,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { milestonesFor, type MilestoneStatus, type ProjectMilestone } from "@/lib/client-portal";
import { leadership } from "@/lib/team";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const longDate = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});

const label: Record<MilestoneStatus, string> = {
  done: "Done",
  active: "In progress",
  upcoming: "Upcoming",
  final: "Final",
};

const icon: Record<MilestoneStatus, typeof CheckCircle2> = {
  done: CheckCircle2,
  active: LoaderCircle,
  upcoming: Circle,
  final: Flag,
};

/** Verb for the date line. A done milestone reads "Completed", the rest "Est." */
const datePrefix: Record<MilestoneStatus, string> = {
  done: "Completed",
  active: "Target",
  upcoming: "Est.",
  final: "Est.",
};

/**
 * Vertical milestone timeline.
 *
 * The active phase is the only one rendered as a full card — everything else is
 * a compact row, which is what makes the current phase findable at a glance.
 * The `<ol>` is deliberate: this is an ordered sequence, and screen readers
 * should announce the position in it.
 */
export function MilestoneRoadmap({ projectId }: { projectId: string }) {
  const milestones = milestonesFor(projectId);

  if (milestones.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-ink-tertiary">
        No milestones have been scheduled for this project yet.
      </p>
    );
  }

  return (
    <div className="relative max-w-4xl">
      {/* The spine. Fades out below the last node so it does not just stop. */}
      <div
        aria-hidden
        className="absolute top-2 bottom-0 left-6 w-px bg-gradient-to-b from-brand/40 via-brand/20 to-transparent"
      />

      <ol className="flex flex-col">
        {milestones.map((milestone, index) => (
          <li
            key={milestone.id}
            className={cn(
              "relative pl-20",
              index < milestones.length - 1 && "pb-14",
              // Finished work recedes; upcoming work is dimmed because it is not
              // yet actionable. The active phase stays at full contrast.
              milestone.status === "done" && "opacity-60",
              (milestone.status === "upcoming" || milestone.status === "final") &&
                "opacity-70"
            )}
          >
            <Node status={milestone.status} />
            {milestone.status === "active" ? (
              <ActiveMilestone milestone={milestone} />
            ) : (
              <QuietMilestone milestone={milestone} />
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function Node({ status }: { status: MilestoneStatus }) {
  const Icon = icon[status];
  const pending = status === "upcoming" || status === "final";

  return (
    <span
      aria-hidden
      className={cn(
        "absolute top-0 left-0 z-10 grid size-12 place-items-center rounded-full",
        status === "done" && "border border-brand-line bg-brand-subtle",
        status === "active" &&
          "animate-pulse-ring border border-brand bg-brand/15 motion-reduce:animate-none",
        pending && "border-2 border-dashed border-line-strong bg-canvas"
      )}
    >
      <Icon
        className={cn(
          "size-5",
          status === "done" && "text-brand",
          status === "active" && "text-brand",
          pending && "text-ink-tertiary"
        )}
      />
    </span>
  );
}

function QuietMilestone({ milestone }: { milestone: ProjectMilestone }) {
  return (
    <div className="pt-2.5">
      <div className="mb-1 flex flex-wrap items-center gap-3">
        <h3 className="font-heading text-xl leading-tight font-semibold text-ink">
          <span className="text-ink-tertiary">{milestone.phase}: </span>
          {milestone.title}
        </h3>
        <Badge variant="outline" size="sm" className="tracking-tight uppercase">
          {label[milestone.status]}
        </Badge>
      </div>

      <p className="max-w-xl text-ink-secondary">{milestone.description}</p>

      <p className="mt-3 flex items-center gap-2 text-[0.8125rem] text-ink-tertiary">
        <CalendarDays className="size-4" aria-hidden />
        {datePrefix[milestone.status]}{" "}
        <time data-tabular dateTime={milestone.date}>
          {longDate.format(new Date(milestone.date))}
        </time>
      </p>
    </div>
  );
}

function ActiveMilestone({ milestone }: { milestone: ProjectMilestone }) {
  const lead = leadership.find((m) => m.id === milestone.leadId);
  const progress = milestone.progress ?? 0;

  return (
    <Card variant="glass" className="border-beam gap-0 rounded-3xl p-8">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
        <div>
          <Badge variant="brand" size="sm" className="mb-3 tracking-widest uppercase">
            {label.active}
          </Badge>
          <h3 className="mb-2 font-heading text-[1.75rem] leading-tight font-semibold text-brand">
            {milestone.phase}: {milestone.title}
          </h3>
          <p className="max-w-xl leading-relaxed text-ink-secondary">
            {milestone.description}
          </p>
        </div>

        {/* Percent block. `role="img"` with a label so the figure is announced
            as one unit rather than "40" then "Progress". */}
        <div
          role="img"
          aria-label={`${progress}% through this phase`}
          className="grid size-24 shrink-0 place-content-center justify-items-center rounded-2xl border border-brand-line bg-brand-subtle"
        >
          <span
            data-tabular
            className="font-heading text-2xl leading-none font-bold text-brand"
          >
            {progress}%
          </span>
          <span className="mt-1 text-[0.625rem] tracking-widest text-ink-tertiary uppercase">
            Progress
          </span>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 border-t border-line-subtle pt-6 md:grid-cols-2">
        <Fact icon={Clock} title="Target delivery">
          <time data-tabular dateTime={milestone.date}>
            {longDate.format(new Date(milestone.date))}
          </time>
        </Fact>
        {lead && (
          <Fact icon={Users} title="Lead assignee">
            {lead.name} — {lead.role}
          </Fact>
        )}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button render={<Link href="#board" />}>Review drafts</Button>
        <Button variant="outline" render={<Link href="/client/messages" />}>
          <MessagesSquare />
          Join discussion
        </Button>
      </div>
    </Card>
  );
}

function Fact({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Clock;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
      <div>
        <p className="text-[0.8125rem] font-semibold text-ink">{title}</p>
        <p className="text-[0.8125rem] text-ink-secondary">{children}</p>
      </div>
    </div>
  );
}
