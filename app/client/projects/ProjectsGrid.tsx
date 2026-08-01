"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Landmark,
  ShieldCheck,
  Store,
  Terminal,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import {
  projectStatuses,
  projectStatusTone,
  type PortalProject,
  type ProjectStatus,
} from "@/lib/client-portal";
import { leadership } from "@/lib/team";
import { AvatarGroup } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

const icons: Record<string, LucideIcon> = {
  bank: Landmark,
  ai: Terminal,
  store: Store,
  chart: BarChart3,
  shield: ShieldCheck,
};

const tone = {
  brand: { text: "text-brand", bar: "bg-brand", chip: "border-brand/20 bg-brand/10 text-brand" },
  ion: { text: "text-ion", bar: "bg-ion", chip: "border-ion/20 bg-ion/10 text-ion" },
  orchid: {
    text: "text-chart-3",
    bar: "bg-chart-3",
    chip: "border-chart-3/20 bg-chart-3/10 text-chart-3",
  },
} as const;

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 0,
});
const shortDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
});

/**
 * Owns the filter state, so it also renders the header row the tabs sit in —
 * the alternative was an empty placeholder component in the page just to hold
 * the layout together.
 */
export function ProjectsGrid({
  heading,
  projects,
}: {
  heading: React.ReactNode;
  /** Supplied by the server from the database; RLS has already scoped it. */
  projects: PortalProject[];
}) {
  const [filter, setFilter] = React.useState<ProjectStatus | "All Projects">("All Projects");

  const shown = React.useMemo(
    () =>
      filter === "All Projects"
        ? projects
        : projects.filter((p) => p.status === filter),
    [filter]
  );

  const tabs: (ProjectStatus | "All Projects")[] = ["All Projects", ...projectStatuses];

  return (
    <>
      <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        {heading}

        {/* The source juggled classes on `.flex-wrap button`, a selector that
            also catches every other button under a wrapping flex container. */}
        <div
          role="group"
          aria-label="Filter projects by status"
          className="flex flex-wrap gap-2 rounded-2xl border border-line bg-surface-sunken p-1.5"
        >
          {tabs.map((tab) => {
            const selected = filter === tab;
            return (
              <button
                key={tab}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(tab)}
                className={cn(
                  "rounded-xl px-6 py-2.5 text-[0.8125rem] font-semibold transition-all duration-300",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  selected
                    ? "bg-brand text-brand-fg shadow-e2"
                    : "text-ink-tertiary hover:bg-surface hover:text-ink"
                )}
              >
                {tab}
              </button>
            );
          })}
        </div>
      </div>

      <p aria-live="polite" className="sr-only">
        Showing {shown.length} of {projects.length} projects.
      </p>

      <ul className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {shown.map((project) => {
          const Icon = icons[project.icon];
          const t = tone[project.tone];
          const budgetPct = Math.round((project.budgetSpent / project.budgetTotal) * 100);
          const team = project.teamIds
            .map((id) => leadership.find((m) => m.id === id))
            .filter((m): m is NonNullable<typeof m> => Boolean(m))
            .map((m) => ({ name: m.name }));

          return (
            <li key={project.id}>
              <Card
                variant="glass"
                lift
                className={cn(
                  "group h-full rounded-[2rem] p-8 duration-500",
                  project.featured && "beam-rotate"
                )}
              >
                <div className="mb-6 flex items-start justify-between gap-3">
                  <span
                    className={cn(
                      "grid size-16 shrink-0 place-items-center rounded-2xl border",
                      t.chip
                    )}
                  >
                    <Icon className="size-7" aria-hidden />
                  </span>
                  <Badge variant={projectStatusTone[project.status]}>{project.status}</Badge>
                </div>

                <h2 className="mb-2 font-heading text-[2rem] leading-[1.3] font-semibold text-ink transition-colors group-hover:text-brand">
                  <Link href={project.href} className="after:absolute after:inset-0">
                    {project.name}
                  </Link>
                </h2>
                <p className="mb-6 line-clamp-2 text-ink-tertiary">{project.description}</p>

                <dl className="mb-8 grid grid-cols-2 gap-4">
                  <div>
                    <dt className="mb-1 text-[0.625rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                      Start Date
                    </dt>
                    <dd data-tabular className="text-[0.8125rem] font-medium text-ink">
                      <time dateTime={project.startDate}>
                        {shortDate.format(new Date(project.startDate))}
                      </time>
                    </dd>
                  </div>
                  <div>
                    <dt className="mb-1 text-[0.625rem] font-semibold tracking-widest text-ink-tertiary uppercase">
                      Target End
                    </dt>
                    <dd data-tabular className="text-[0.8125rem] font-medium text-ink">
                      <time dateTime={project.targetEnd}>
                        {shortDate.format(new Date(project.targetEnd))}
                      </time>
                    </dd>
                  </div>
                </dl>

                <div className="mb-8 flex flex-col gap-6">
                  <Meter
                    label="Budget Allocation"
                    value={budgetPct}
                    barClass={t.bar}
                    readout={
                      <>
                        <span data-tabular>{money.format(project.budgetSpent)}</span>{" "}
                        <span className="text-ink-tertiary">
                          / <span data-tabular>{money.format(project.budgetTotal)}</span>
                        </span>
                      </>
                    }
                  />
                  <Meter
                    label="Project Completion"
                    value={project.progress}
                    barClass="bg-ion"
                    readout={
                      <span data-tabular className={t.text}>
                        {project.progress}%
                      </span>
                    }
                  />
                </div>

                <div className="mt-auto flex items-center justify-between border-t border-line-subtle pt-6">
                  <AvatarGroup
                    people={team}
                    size="default"
                    max={3 + project.extraTeam}
                  />
                  <ArrowRight
                    className={cn(
                      "size-5 transition-transform duration-(--duration-normal) group-hover:translate-x-1",
                      t.text
                    )}
                    aria-hidden
                  />
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && (
        <p className="rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center text-ink-tertiary">
          No projects with that status.
        </p>
      )}
    </>
  );
}

function Meter({
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
        <p className="text-[0.625rem] font-semibold tracking-widest text-ink-tertiary uppercase">
          {label}
        </p>
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
          className={cn("h-full rounded-full shadow-[0_0_20px_var(--brand-glow)]", barClass)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}
