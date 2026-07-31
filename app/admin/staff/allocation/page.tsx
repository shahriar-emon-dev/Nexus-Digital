import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, MessageSquare, PieChart, TrendingDown, TrendingUp, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  bandMeta,
  billableRatio,
  CONFLICT_THRESHOLD_HOURS,
  conflicts,
  conflictTone,
  globalUtilisation,
  memberFor,
  overheadRatio,
  velocitySeries,
  velocityStats,
  WEEKLY_CAPACITY_HOURS,
} from "@/lib/allocation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { AllocationGrid } from "./AllocationGrid";

export const metadata: Metadata = { title: "Resource Allocation" };

export default function AdminAllocationPage() {
  return (
    <>
      

      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs items={[
          { label: "Command Center", href: "/admin" },
          { label: "Staff", href: "/admin/staff" },
          { label: "Allocation" },
        ]} />
        <header className="flex flex-col justify-between gap-6 xl:flex-row xl:items-end">
          <div>
            <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
              Resource Heatmap
            </h1>
            <p className="mt-2 max-w-2xl text-ink-tertiary">
              Talent distribution and operational bandwidth across every department.
            </p>
          </div>

          {/* The legend is the key to the grid, so it states the thresholds
              rather than only naming the colours. */}
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {(
              [
                ["overbooked", "over 100%"],
                ["optimal", "60–100%"],
                ["under", "under 60%"],
                ["off", "not scheduled"],
              ] as const
            ).map(([band, range]) => (
              <li key={band} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-3 shrink-0 rounded-sm", bandMeta[band].dot)}
                />
                <span className="text-[0.75rem] text-ink-tertiary">
                  <span className="font-semibold text-ink-secondary">
                    {bandMeta[band].label}
                  </span>{" "}
                  {range}
                </span>
              </li>
            ))}
          </ul>
        </header>

        {/* ── KPIs ──────────────────────────────────────────────────────── */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card variant="glass" lift className="group relative gap-0 overflow-hidden rounded-2xl p-6">
            <PieChart
              className="pointer-events-none absolute -top-3 -right-3 size-24 text-brand opacity-[0.07] transition-opacity duration-(--duration-slow) group-hover:opacity-20"
              aria-hidden
            />
            <p className="text-[0.8125rem] text-ink-tertiary">Global utilisation</p>
            <p
              data-tabular
              className="mt-2 font-heading text-[2.5rem] leading-none font-bold text-brand"
            >
              {globalUtilisation.toFixed(1)}%
            </p>
            <div
              className="mt-4 h-1.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-label="Global utilisation"
              aria-valuenow={Math.round(globalUtilisation)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand shadow-[0_0_12px_var(--brand-glow)]"
                style={{ width: `${Math.min(100, globalUtilisation)}%` }}
              />
            </div>
            <p className="mt-2 text-[0.75rem] text-ink-tertiary">
              Working days only, across{" "}
              <Link
                href="/admin/staff"
                className="rounded-sm text-brand underline underline-offset-4 decoration-brand/40 hover:decoration-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              >
                the full roster
              </Link>
              .
            </p>
          </Card>

          <Card variant="glass" lift className="group relative gap-0 overflow-hidden rounded-2xl p-6">
            <Zap
              className="pointer-events-none absolute -top-3 -right-3 size-24 text-ion opacity-[0.07] transition-opacity duration-(--duration-slow) group-hover:opacity-20"
              aria-hidden
            />
            <p className="text-[0.8125rem] text-ink-tertiary">Weekly velocity</p>
            <div className="mt-2 flex items-end gap-3">
              <span
                data-tabular
                className="font-heading text-[2.5rem] leading-none font-bold text-ink"
              >
                {velocityStats.current}
              </span>
              <span className="mb-1 text-ink-tertiary">pts</span>
              <span
                className={cn(
                  "mb-1 flex items-center gap-1 text-[0.8125rem] font-semibold",
                  velocityStats.deltaPct >= 0 ? "text-success" : "text-danger"
                )}
              >
                {velocityStats.deltaPct >= 0 ? (
                  <TrendingUp className="size-4" aria-hidden />
                ) : (
                  <TrendingDown className="size-4" aria-hidden />
                )}
                <span data-tabular>
                  {velocityStats.deltaPct > 0 ? "+" : ""}
                  {velocityStats.deltaPct.toFixed(1)}%
                </span>
              </span>
            </div>

            {/* Bars come from the series; the design's were fixed heights. */}
            <ul className="mt-4 flex h-10 items-end gap-1.5">
              {velocitySeries.map((points, i) => {
                const latest = i === velocitySeries.length - 1;
                return (
                  <li
                    key={i}
                    className="flex h-full flex-1 items-end"
                    title={`Week ${i + 1}: ${points} points`}
                  >
                    <span
                      className={cn(
                        "block w-full rounded-sm",
                        latest ? "bg-ion" : "bg-ion/35"
                      )}
                      style={{
                        height: `${(points / Math.max(...velocitySeries)) * 100}%`,
                      }}
                    />
                    <span className="sr-only">
                      Week {i + 1}: {points} points
                    </span>
                  </li>
                );
              })}
            </ul>
          </Card>

          <Card variant="glass" lift className="gap-0 rounded-2xl p-6">
            <p className="text-[0.8125rem] text-ink-tertiary">Overhead ratio</p>
            <p
              data-tabular
              className="mt-2 font-heading text-[2.5rem] leading-none font-bold text-ion"
            >
              {overheadRatio}%
            </p>

            {/* One bar split in two, because the halves are one number. */}
            <div className="mt-4 flex h-1.5 overflow-hidden rounded-full">
              <span className="bg-brand" style={{ width: `${billableRatio}%` }} />
              <span className="bg-ion" style={{ width: `${overheadRatio}%` }} />
            </div>
            <dl className="mt-3 flex justify-between gap-4 text-[0.75rem]">
              <div>
                <dt className="text-ink-tertiary">Direct billable</dt>
                <dd data-tabular className="font-semibold text-brand">
                  {billableRatio}%
                </dd>
              </div>
              <div className="text-right">
                <dt className="text-ink-tertiary">Admin / internal</dt>
                <dd data-tabular className="font-semibold text-ion">
                  {overheadRatio}%
                </dd>
              </div>
            </dl>
          </Card>
        </section>

        {/* ── Grid + conflicts ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <AllocationGrid />

          <Card
            variant="glass"
            className="gap-5 rounded-3xl border-t-2 border-t-danger p-6 xl:sticky xl:top-24"
          >
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-danger-subtle text-danger">
                <AlertTriangle className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-heading text-lg font-semibold text-ink">Conflicts</h2>
                <p className="text-[0.6875rem] tracking-wider text-ink-tertiary uppercase">
                  Peak week over{" "}
                  <span data-tabular>{CONFLICT_THRESHOLD_HOURS}</span> hrs
                </p>
              </div>
            </div>

            {conflicts.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-[0.8125rem] text-ink-tertiary">
                Nobody is over the threshold this month.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {conflicts.map((conflict) => {
                  const member = memberFor(conflict.memberId);
                  return (
                    <li
                      key={conflict.memberId}
                      className={cn(
                        "rounded-xl border bg-surface-sunken p-4",
                        "transition-[transform,border-color] duration-(--duration-normal) ease-(--ease-out-quint)",
                        "hover:-translate-y-0.5",
                        conflict.severity === "Critical"
                          ? "border-danger-line"
                          : "border-line hover:border-brand-line",
                        conflict.severity === "Watch" && "opacity-75"
                      )}
                    >
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <Badge
                          variant={conflictTone[conflict.severity]}
                          size="sm"
                          className="tracking-wider uppercase"
                        >
                          {conflict.severity}
                        </Badge>
                        <span
                          data-tabular
                          className="text-[0.75rem] font-bold text-ink-secondary"
                        >
                          {conflict.peakHours} hrs
                        </span>
                      </div>

                      <h3 className="text-[0.875rem] font-semibold text-ink">
                        {member?.name}
                      </h3>
                      <p className="mt-1 text-[0.75rem] text-ink-tertiary">
                        {conflict.detail}
                      </p>

                      {conflict.severity !== "Watch" && (
                        <div className="mt-4 flex gap-2">
                          {/* TODO: open the reassignment flow once it exists. */}
                          <Button variant="outline" size="sm" className="flex-1">
                            Reassign
                          </Button>
                          <Button
                            variant="outline"
                            size="icon-sm"
                            aria-label={`Message ${member?.name}`}
                            render={<Link href="/admin/staff" />}
                          >
                            <MessageSquare />
                          </Button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <p className="text-[0.6875rem] text-ink-tertiary">
              A standard week is <span data-tabular>{WEEKLY_CAPACITY_HOURS}</span> hours.
              Figures are the busiest rolling seven days in the window.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}
