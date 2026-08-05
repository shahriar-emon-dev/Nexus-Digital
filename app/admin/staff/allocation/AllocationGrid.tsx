"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, FilterX, Loader2, Plus, Trash2, Users } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  removeAssignment,
  saveAssignment,
  type StaffAssignment,
  type StaffMember,
} from "@/lib/supabase/staff-actions";
import { cn } from "@/lib/utils";

/**
 * Allocation, at the resolution the business actually records.
 *
 * The previous grid was a day-by-day heatmap across 24 columns of invented
 * hours, over a roster with nothing scheduled. Assignments are recorded per
 * week, so a per-day view would be fabricating precision. This shows each
 * person's booked hours against their contracted hours, broken down by the
 * projects that produce the number.
 */

type Band = "overbooked" | "optimal" | "under" | "unscheduled";

const bandMeta: Record<
  Band,
  { label: string; hint: string; tone: "danger" | "success" | "info" | "default"; bar: string }
> = {
  overbooked: { label: "Overbooked", hint: "over contracted hours", tone: "danger", bar: "bg-danger" },
  optimal: { label: "Optimised", hint: "60–100%", tone: "success", bar: "bg-success" },
  under: { label: "Underutilised", hint: "under 60%", tone: "info", bar: "bg-info" },
  unscheduled: { label: "Not scheduled", hint: "no assignment", tone: "default", bar: "bg-line-strong" },
};

function bandFor(assigned: number, capacity: number): Band {
  if (assigned === 0 || capacity <= 0) return "unscheduled";
  const pct = (assigned / capacity) * 100;
  if (pct > 100) return "overbooked";
  if (pct >= 60) return "optimal";
  return "under";
}

/** Stable colour per project, so one project reads the same in every row. */
const projectHues = ["bg-brand", "bg-ion", "bg-success", "bg-warning", "bg-info"];

export function AllocationGrid({
  staff,
  assignments,
  projects,
}: {
  staff: StaffMember[];
  assignments: StaffAssignment[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();

  const [department, setDepartment] = React.useState<string>("all");
  const [timezone, setTimezone] = React.useState<string>("all");
  const [seniority, setSeniority] = React.useState<string>("all");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [assigning, setAssigning] = React.useState<StaffMember | null>(null);

  useRealtime(
    "admin:allocation",
    [{ table: "project_assignments" }, { table: "staff_profiles" }],
    () => router.refresh()
  );

  const departments = React.useMemo(
    () => [...new Set(staff.map((s) => s.department).filter(Boolean))] as string[],
    [staff]
  );
  const timezones = React.useMemo(
    () => [...new Set(staff.map((s) => s.profiles?.timezone).filter(Boolean))] as string[],
    [staff]
  );
  const seniorities = React.useMemo(
    () => [...new Set(staff.map((s) => s.seniority).filter(Boolean))] as string[],
    [staff]
  );

  const byPerson = React.useMemo(() => {
    const m = new Map<string, StaffAssignment[]>();
    for (const a of assignments) {
      const list = m.get(a.profileId) ?? [];
      list.push(a);
      m.set(a.profileId, list);
    }
    return m;
  }, [assignments]);

  const projectHue = React.useMemo(() => {
    const m = new Map<string, string>();
    projects.forEach((p, i) => m.set(p.id, projectHues[i % projectHues.length]));
    return m;
  }, [projects]);

  const rows = React.useMemo(
    () =>
      staff.filter((s) => {
        if (department !== "all" && s.department !== department) return false;
        if (timezone !== "all" && s.profiles?.timezone !== timezone) return false;
        if (seniority !== "all" && s.seniority !== seniority) return false;
        return true;
      }),
    [staff, department, timezone, seniority]
  );

  const filtered = department !== "all" || timezone !== "all" || seniority !== "all";

  // A conflict is somebody past their OWN contracted hours, not past a fixed
  // 45-hour threshold — a part-time contract is breached far earlier than that.
  const conflicts = rows.filter(
    (s) => s.utilisation.capacityHours > 0 && s.utilisation.assignedHours > s.utilisation.capacityHours
  );

  async function run(fn: () => Promise<{ ok: true } | { error: string }>, message: string) {
    setBusy(true);
    setError(null);
    const result = await fn();
    setBusy(false);
    if ("error" in result) {
      setError(result.error);
      return false;
    }
    toast.add({ title: message, type: "success" });
    router.refresh();
    return true;
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {conflicts.length > 0 && (
        <Alert tone="warning">
          <AlertDescription>
            {conflicts.length} {conflicts.length === 1 ? "specialist is" : "specialists are"} booked
            beyond their contracted hours:{" "}
            {conflicts
              .map(
                (c) =>
                  `${c.profiles?.full_name ?? c.slug} (${c.utilisation.assignedHours}h of ${c.utilisation.capacityHours}h)`
              )
              .join(", ")}
            .
          </AlertDescription>
        </Alert>
      )}

      {/* -------------------------------------------------------- filters -- */}
      <Card variant="glass" className="rounded-2xl">
        <CardContent className="flex flex-wrap items-end gap-4 p-4">
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

          <Field label="Time zone">
            <Select value={timezone} onChange={setTimezone}>
              <option value="all">All time zones</option>
              {timezones.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </Select>
          </Field>

          {seniorities.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span
                id="seniority-label"
                className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
              >
                Seniority
              </span>
              <div role="group" aria-labelledby="seniority-label" className="flex flex-wrap gap-2">
                {["all", ...seniorities].map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    aria-pressed={seniority === tier}
                    onClick={() => setSeniority(tier)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-[0.8125rem] font-medium transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                      seniority === tier
                        ? "bg-brand text-brand-fg"
                        : "bg-surface-sunken text-ink-secondary hover:text-ink"
                    )}
                  >
                    {tier === "all" ? "All" : tier}
                  </button>
                ))}
              </div>
            </div>
          )}

          {filtered && (
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
              Clear filters
            </Button>
          )}
        </CardContent>
      </Card>

      {/* --------------------------------------------------------- legend -- */}
      <ul className="flex flex-wrap gap-x-5 gap-y-2">
        {(Object.keys(bandMeta) as Band[]).map((b) => (
          <li key={b} className="flex items-center gap-2 text-[0.8125rem] text-ink-secondary">
            <span className={cn("size-2.5 rounded-full", bandMeta[b].bar)} aria-hidden />
            <span className="font-medium text-ink">{bandMeta[b].label}</span>
            <span className="text-ink-tertiary">{bandMeta[b].hint}</span>
          </li>
        ))}
      </ul>

      {/* ------------------------------------------------------------ rows -- */}
      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={staff.length === 0 ? "Nobody on the roster" : "No matches"}
          description={
            staff.length === 0
              ? "Allocation is computed from assignments against contracted hours. Add people to the staff roster first."
              : "No specialist matches those filters."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <ul className="divide-y divide-line-subtle">
              {rows.map((s) => {
                const mine = byPerson.get(s.id) ?? [];
                const capacity = s.utilisation.capacityHours;
                const assigned = s.utilisation.assignedHours;
                const band = bandFor(assigned, capacity);
                const name = s.profiles?.full_name || s.profiles?.email || s.slug;
                // Scaled against the larger of capacity and assigned, so an
                // overbooked row visibly runs past the marker rather than
                // being clipped at 100% and looking merely full.
                const scale = Math.max(capacity, assigned) || 1;

                return (
                  <li key={s.id} className="flex flex-col gap-3 p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <Avatar className="size-9">
                        {s.profiles?.avatar_url && <AvatarImage src={s.profiles.avatar_url} alt="" />}
                        <AvatarFallback>{initials(name)}</AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-ink">{name}</p>
                        <p className="truncate text-xs text-ink-tertiary">
                          {s.display_role}
                          {s.department ? ` · ${s.department}` : ""}
                          {s.profiles?.timezone ? ` · ${s.profiles.timezone.replace("_", " ")}` : ""}
                        </p>
                      </div>

                      <span data-tabular className="text-sm text-ink-secondary">
                        {assigned}h / {capacity}h
                      </span>
                      <Badge variant={bandMeta[band].tone} size="sm">
                        {band === "unscheduled" ? bandMeta[band].label : `${s.utilisation.pct ?? 0}%`}
                      </Badge>
                      <Button variant="ghost" size="xs" onClick={() => setAssigning(s)}>
                        <Plus />
                        Assign
                      </Button>
                    </div>

                    {/* Stacked: one segment per project, so the total is
                        visibly the sum of its parts rather than a lone number. */}
                    <div className="relative">
                      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-sunken">
                        {mine.map((a) => (
                          <span
                            key={a.id}
                            className={cn(projectHue.get(a.projectId) ?? "bg-brand", "h-full")}
                            style={{ width: `${(a.hoursPerWeek / scale) * 100}%` }}
                            title={`${a.projectName}: ${a.hoursPerWeek}h`}
                          />
                        ))}
                      </div>
                      {capacity > 0 && assigned > capacity && (
                        <span
                          className="absolute top-0 h-3 w-px bg-ink"
                          style={{ left: `${(capacity / scale) * 100}%` }}
                          aria-hidden
                        />
                      )}
                    </div>

                    {mine.length === 0 ? (
                      <p className="text-xs text-ink-tertiary">No current assignments.</p>
                    ) : (
                      <ul className="flex flex-wrap gap-2">
                        {mine.map((a) => (
                          <li key={a.id}>
                            <span className="flex items-center gap-1.5 rounded-lg border border-line-subtle bg-surface-sunken px-2 py-1 text-xs">
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  projectHue.get(a.projectId) ?? "bg-brand"
                                )}
                                aria-hidden
                              />
                              <span className="text-ink">{a.projectName}</span>
                              <span className="text-ink-tertiary">{a.hoursPerWeek}h</span>
                              {a.roleOnProject && (
                                <span className="text-ink-tertiary">· {a.roleOnProject}</span>
                              )}
                              <Button
                                variant="ghost"
                                size="icon-xs"
                                className="text-danger"
                                disabled={busy}
                                onClick={() => run(() => removeAssignment(a.id), "Assignment removed")}
                                aria-label={`Remove ${name} from ${a.projectName}`}
                              >
                                <Trash2 />
                              </Button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <p className="flex items-start gap-2 text-xs text-ink-tertiary">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Hours are recorded per week per assignment. This view does not break
        them down by day, because nothing in the system records which day the
        work happens.
      </p>

      {/* ------------------------------------------------------ assignment -- */}
      <Dialog open={assigning !== null} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent>
          {assigning && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = new FormData(e.currentTarget);
                form.set("profileId", assigning.id);
                if (await run(() => saveAssignment(form), "Assignment saved")) setAssigning(null);
              }}
            >
              <DialogHeader>
                <DialogTitle>Assign {assigning.profiles?.full_name || assigning.slug}</DialogTitle>
                <DialogDescription>
                  {assigning.utilisation.assignedHours}h of{" "}
                  {assigning.utilisation.capacityHours}h currently booked.
                  Assigning to a project they are already on updates the
                  existing hours rather than adding a second entry.
                </DialogDescription>
              </DialogHeader>
              <DialogBody className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="a-project">Project</Label>
                  <select
                    id="a-project"
                    name="projectId"
                    required
                    className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                  >
                    <option value="">Choose a project…</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="a-hours">Hours per week</Label>
                    <Input
                      id="a-hours"
                      name="hoursPerWeek"
                      type="number"
                      min="0"
                      max="168"
                      step="0.5"
                      defaultValue={8}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="a-role">Role on project</Label>
                    <Input id="a-role" name="roleOnProject" placeholder="Tech lead, QA…" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="a-start">Starts</Label>
                    <Input id="a-start" name="startsOn" type="date" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="a-end">Ends</Label>
                    <Input id="a-end" name="endsOn" type="date" />
                  </div>
                </div>
                <p className="text-xs text-ink-tertiary">
                  Leave the dates empty for an open-ended assignment. Only
                  assignments live today count toward utilisation.
                </p>
              </DialogBody>
              <DialogFooter>
                <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                <Button type="submit" disabled={busy}>
                  {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
                  Save assignment
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  const id = React.useId();
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="ml-1 text-[0.625rem] font-bold tracking-widest text-ink-tertiary uppercase"
      >
        {label}
      </label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ id?: string }>, { id })
        : children}
    </div>
  );
}

function Select({
  value,
  onChange,
  children,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9.5 min-w-44 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
    >
      {children}
    </select>
  );
}
