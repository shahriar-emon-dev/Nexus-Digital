"use client";

import * as React from "react";
import { FilterX } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  allocations,
  bandFor,
  bandMeta,
  DAYS_IN_MONTH,
  dayPercent,
  departments,
  isWeekend,
  memberFor,
  monthLabel,
  peakWeekHours,
  seniorities,
  timezones,
  weekdayFor,
  type Seniority,
} from "@/lib/allocation";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const days = Array.from({ length: DAYS_IN_MONTH }, (_, i) => i + 1);

export function AllocationGrid() {
  const [department, setDepartment] = React.useState<string>("all");
  const [timezone, setTimezone] = React.useState<string>("all");
  const [seniority, setSeniority] = React.useState<Seniority | "all">("all");

  const active = department !== "all" || timezone !== "all" || seniority !== "all";

  const rows = React.useMemo(
    () =>
      allocations.filter((allocation) => {
        const member = memberFor(allocation.memberId);
        if (!member) return false;
        if (department !== "all" && member.department !== department) return false;
        if (timezone !== "all" && allocation.timezone !== timezone) return false;
        if (seniority !== "all" && allocation.seniority !== seniority) return false;
        return true;
      }),
    [department, timezone, seniority]
  );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <Card variant="glass" className="flex-row flex-wrap items-end gap-4 rounded-2xl p-4">
        <Field label="Department">
          <Select value={department} onChange={setDepartment}>
            <option value="all">All departments</option>
            {departments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Timezone">
          <Select value={timezone} onChange={setTimezone}>
            <option value="all">All timezones</option>
            {timezones.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Field>

        <div className="flex flex-col gap-1.5">
          <span
            id="seniority-label"
            className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
          >
            Seniority
          </span>
          <div
            role="group"
            aria-labelledby="seniority-label"
            className="flex flex-wrap gap-2"
          >
            {(["all", ...seniorities] as const).map((tier) => {
              const selected = seniority === tier;
              return (
                <button
                  key={tier}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setSeniority(tier as Seniority | "all")}
                  className={cn(
                    "rounded-lg px-3 py-2 text-[0.75rem] font-semibold transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    selected
                      ? "bg-brand text-brand-fg"
                      : "bg-surface-sunken text-ink-tertiary hover:bg-surface hover:text-ink"
                  )}
                >
                  {tier === "all" ? "All" : tier}
                </button>
              );
            })}
          </div>
        </div>

        {active && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto"
            onClick={() => {
              setDepartment("all");
              setTimezone("all");
              setSeniority("all");
            }}
          >
            <FilterX />
            Clear all
          </Button>
        )}
      </Card>

      {/* ── Heatmap ─────────────────────────────────────────────────────── */}
      <Card variant="glass" className="min-w-0 gap-0 overflow-hidden rounded-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line bg-surface-sunken/60 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold text-ink">{monthLabel}</h2>
          <p aria-live="polite" className="text-[0.8125rem] text-ink-tertiary">
            <span data-tabular>{rows.length}</span> of{" "}
            <span data-tabular>{allocations.length}</span> specialists
          </p>
        </div>

        <div className="scrollbar-none min-w-0 overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">
              Daily utilisation per specialist for {monthLabel}. Each cell states
              the booked hours and the share of capacity used.
            </caption>
            <thead>
              <tr className="bg-surface-sunken/40">
                <th
                  scope="col"
                  className="sticky left-0 z-10 min-w-52 bg-surface-raised px-4 py-3 text-[0.6875rem] font-semibold tracking-widest text-ink-tertiary uppercase"
                >
                  Specialist
                </th>
                {days.map((day) => (
                  <th
                    key={day}
                    scope="col"
                    className={cn(
                      "w-9 px-0 py-3 text-center text-[0.625rem] font-semibold text-ink-tertiary",
                      isWeekend(day) && "text-ink-tertiary/50"
                    )}
                  >
                    <span className="block leading-none">{weekdayFor(day)}</span>
                    <span data-tabular className="block leading-tight">
                      {String(day).padStart(2, "0")}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-line-subtle">
              {rows.map((allocation) => {
                const member = memberFor(allocation.memberId)!;
                const peak = peakWeekHours(allocation.daily);
                return (
                  <tr key={allocation.memberId} className="group">
                    <th
                      scope="row"
                      className="sticky left-0 z-10 bg-surface-raised px-4 py-3 text-left font-normal transition-colors group-hover:bg-surface-sunken"
                    >
                      <span className="flex items-center gap-3">
                        <Avatar size="sm" className="rounded-lg">
                          <AvatarFallback aria-hidden className="rounded-lg">
                            {initials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0">
                          <span className="block truncate text-[0.8125rem] font-semibold text-ink">
                            {member.name}
                          </span>
                          <span className="block truncate text-[0.6875rem] text-ink-tertiary">
                            {allocation.seniority} · {allocation.timezone}
                          </span>
                        </span>
                        {peak > 45 && (
                          <Badge variant="danger" size="sm" data-tabular className="ml-auto">
                            {peak}h
                          </Badge>
                        )}
                      </span>
                    </th>

                    {allocation.daily.map((hours, i) => {
                      const day = i + 1;
                      const percent = dayPercent(hours);
                      const band = bandFor(percent);
                      return (
                        <td key={day} className="p-0.5">
                          {/* Title carries the figure for pointer users; the
                              sr-only text carries it for everyone else. Nothing
                              here relies on colour alone. */}
                          <span
                            title={`${member.name}, ${day} ${monthLabel}: ${hours}h (${percent}%)`}
                            className={cn(
                              "block h-9 w-full rounded-sm transition-colors duration-(--duration-fast)",
                              bandMeta[band].cell
                            )}
                          >
                            <span className="sr-only">
                              {day} {monthLabel}: {hours} hours, {percent}% of capacity,{" "}
                              {bandMeta[band].label}
                            </span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <p className="px-6 py-16 text-center text-ink-tertiary">
            No specialists match those filters.
          </p>
        )}
      </Card>
    </div>
  );
}

/** A real <label> wrapper — a <span> leaves the select with no accessible name. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Select({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "h-9.5 min-w-44 cursor-pointer rounded-lg border border-line bg-surface-sunken px-3",
        "text-[0.8125rem] font-medium text-ink transition-colors hover:border-line-strong",
        "focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
      )}
    >
      {children}
    </select>
  );
}
