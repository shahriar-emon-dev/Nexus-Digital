"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Check,
  FolderKanban,
  Loader2,
  Pencil,
  Plus,
  Search,
  Star,
  Trash2,
} from "lucide-react";

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
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/field";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatCard } from "@/components/shared/StatCard";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  createProject,
  deleteProject,
  updateProject,
  type AdminProject,
  type ProjectOptions,
  type ProjectStatus,
} from "@/lib/supabase/project-actions";
import { cn } from "@/lib/utils";

const STATUSES: ProjectStatus[] = ["Active", "On Hold", "Completed", "Archived"];

const statusTone: Record<ProjectStatus, "success" | "warning" | "brand" | "default"> = {
  Active: "success",
  "On Hold": "warning",
  Completed: "brand",
  Archived: "default",
};

type SortKey = "name" | "progress" | "budget" | "end";

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export function ProjectsTable({
  initial,
  options,
}: {
  initial: AdminProject[];
  options: ProjectOptions;
}) {
  const router = useRouter();
  const toast = useToast();

  const [projects, setProjects] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [status, setStatus] = React.useState<string>("all");
  const [org, setOrg] = React.useState<string>("all");
  const [sort, setSort] = React.useState<SortKey>("name");
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<AdminProject | null>(null);
  const [removing, setRemoving] = React.useState<AdminProject | null>(null);

  React.useEffect(() => setProjects(initial), [initial]);

  // Tasks move the progress figure, so the board changing has to reach here.
  useRealtime(
    "admin:projects",
    [{ table: "projects" }, { table: "project_tasks" }, { table: "project_milestones" }],
    () => router.refresh()
  );

  const portfolio = React.useMemo(() => {
    const active = projects.filter((p) => p.status === "Active");
    return {
      total: projects.length,
      active: active.length,
      budgetTotal: projects.reduce((n, p) => n + Number(p.budget_total), 0),
      budgetSpent: projects.reduce((n, p) => n + Number(p.budget_spent), 0),
      averageProgress: active.length
        ? Math.round(active.reduce((n, p) => n + p.progress, 0) / active.length)
        : null,
    };
  }, [projects]);

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = projects.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (org !== "all" && p.organization_id !== org) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        (p.organizations?.name ?? "").toLowerCase().includes(q) ||
        (p.lead?.full_name ?? "").toLowerCase().includes(q)
      );
    });

    return [...rows].sort((a, b) => {
      switch (sort) {
        case "progress":
          return b.progress - a.progress;
        case "budget":
          return Number(b.budget_total) - Number(a.budget_total);
        case "end":
          // Undated projects sort last rather than to the top, where an empty
          // string would otherwise put them.
          return (a.target_end ?? "9999").localeCompare(b.target_end ?? "9999");
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [projects, query, status, org, sort]);

  async function run(fn: () => Promise<{ ok: true } | { error: string } | { ok: true; data: unknown }>, message: string) {
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
    <div className="flex flex-col gap-6">
      {error && (
        <Alert tone="danger" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Projects" value={String(portfolio.total)} icon={FolderKanban} />
        <StatCard label="Active" value={String(portfolio.active)} />
        <StatCard
          label="Committed budget"
          value={money.format(portfolio.budgetTotal)}
          caption={`${money.format(portfolio.budgetSpent)} spent`}
        />
        {/* No average when nothing is active — an average of nothing is not 0%. */}
        <StatCard
          label="Average progress"
          value={portfolio.averageProgress === null ? "—" : `${portfolio.averageProgress}%`}
          caption={portfolio.averageProgress === null ? "No active projects" : "Across active work"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search project, client or lead…"
            aria-label="Search projects"
            className="pl-9"
          />
        </div>

        <Select value={status} onValueChange={(v) => setStatus(v as string)}>
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {options.organizations.length > 1 && (
          <Select value={org} onValueChange={(v) => setOrg(v as string)}>
            <SelectTrigger className="w-44" aria-label="Filter by client">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All clients</SelectItem>
              {options.organizations.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
          <SelectTrigger className="w-40" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="progress">Progress</SelectItem>
            <SelectItem value="budget">Budget</SelectItem>
            <SelectItem value="end">Target date</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => setCreating(true)}>
          <Plus />
          New project
        </Button>
      </div>

      <p className="sr-only" aria-live="polite">
        Showing {visible.length} of {projects.length} projects.
      </p>

      {visible.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={projects.length === 0 ? "No projects yet" : "No matches"}
          description={
            projects.length === 0
              ? "A project holds the board, the roadmap and the budget a client sees in their portal."
              : "No project matches that search and filter."
          }
          action={
            projects.length === 0 ? (
              <Button size="sm" onClick={() => setCreating(true)}>
                <Plus />
                New project
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setQuery("");
                  setStatus("all");
                  setOrg("all");
                }}
              >
                Clear filters
              </Button>
            )
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[64rem] border-collapse text-left">
                <caption className="sr-only">
                  Every project with its client, lead, progress and budget.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Project</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Client</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Lead</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Progress</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Budget</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Target</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {visible.map((p) => {
                    const over = Number(p.budget_spent) > Number(p.budget_total);
                    return (
                      <tr key={p.id} className="transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex min-w-0 items-center gap-2">
                            {p.featured && <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Featured" />}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-ink">
                                {p.name}
                              </span>
                              <span className="block text-xs text-ink-tertiary">
                                {p.taskCount} {p.taskCount === 1 ? "task" : "tasks"} ·{" "}
                                {p.milestoneCount}{" "}
                                {p.milestoneCount === 1 ? "milestone" : "milestones"}
                              </span>
                            </span>
                          </span>
                        </th>

                        <td className="px-3 py-3 text-sm text-ink-secondary">
                          {p.organizations?.name ?? <span className="text-ink-tertiary">—</span>}
                        </td>

                        <td className="px-3 py-3">
                          {p.lead ? (
                            <span className="flex items-center gap-2">
                              <Avatar className="size-6">
                                {p.lead.avatar_url && <AvatarImage src={p.lead.avatar_url} alt="" />}
                                <AvatarFallback className="text-[0.625rem]">
                                  {initials(p.lead.full_name || p.lead.email)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-sm text-ink-secondary">
                                {p.lead.full_name || p.lead.email}
                              </span>
                            </span>
                          ) : (
                            <span className="text-sm text-ink-tertiary">Unassigned</span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <Badge variant={statusTone[p.status]} size="sm">
                            {p.status}
                          </Badge>
                        </td>

                        <td className="px-3 py-3">
                          <span className="flex min-w-24 flex-col gap-1">
                            <Progress value={p.progress} className="h-1.5" />
                            <span data-tabular className="text-xs text-ink-tertiary">
                              {p.progress}%
                            </span>
                          </span>
                        </td>

                        <td className="px-3 py-3">
                          <span data-tabular className="block text-sm text-ink">
                            {money.format(Number(p.budget_total))}
                          </span>
                          <span
                            data-tabular
                            className={cn("block text-xs", over ? "text-danger" : "text-ink-tertiary")}
                          >
                            {money.format(Number(p.budget_spent))} spent
                          </span>
                        </td>

                        <td className="px-3 py-3 text-sm text-ink-secondary">
                          {p.target_end ? (
                            dateFmt.format(new Date(p.target_end))
                          ) : (
                            <span className="text-ink-tertiary">—</span>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              render={<Link href={`/client/projects/${p.slug}`} />}
                              aria-label={`Open the client view of ${p.name}`}
                            >
                              <ArrowUpRight />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => setEditing(p)}
                              aria-label={`Edit ${p.name}`}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="text-danger"
                              onClick={() => setRemoving(p)}
                              aria-label={`Delete ${p.name}`}
                            >
                              <Trash2 />
                            </Button>
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ProjectDialog
        open={creating}
        onOpenChange={setCreating}
        options={options}
        busy={busy}
        title="New project"
        description="Creates the project a client sees in their portal, with its board and roadmap ready to fill."
        submitLabel="Create project"
        onSubmit={async (form) => {
          if (await run(() => createProject(form), "Project created")) setCreating(false);
        }}
      />

      <ProjectDialog
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        options={options}
        busy={busy}
        project={editing ?? undefined}
        title={editing ? `Edit ${editing.name}` : "Edit"}
        description="Changes appear in the client portal immediately."
        submitLabel="Save changes"
        onSubmit={async (form) => {
          if (!editing) return;
          if (await run(() => updateProject(editing.id, form), "Project saved")) setEditing(null);
        }}
      />

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          {removing && (
            <>
              <DialogHeader>
                <DialogTitle>Delete {removing.name}?</DialogTitle>
                <DialogDescription>
                  Its {removing.taskCount} {removing.taskCount === 1 ? "task" : "tasks"} and{" "}
                  {removing.milestoneCount}{" "}
                  {removing.milestoneCount === 1 ? "milestone" : "milestones"} are deleted with it,
                  and the client loses this project from their portal. Consider
                  archiving instead — that keeps the record and the history.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="justify-between">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={async () => {
                    const form = new FormData();
                    form.set("name", removing.name);
                    form.set("description", removing.description);
                    form.set("organizationId", removing.organization_id);
                    form.set("status", "Archived");
                    form.set("stage", removing.stage);
                    form.set("leadId", removing.lead_id ?? "");
                    form.set("startDate", removing.start_date ?? "");
                    form.set("targetEnd", removing.target_end ?? "");
                    form.set("budgetTotal", String(removing.budget_total));
                    form.set("budgetSpent", String(removing.budget_spent));
                    if (await run(() => updateProject(removing.id, form), "Project archived")) {
                      setRemoving(null);
                    }
                  }}
                >
                  Archive instead
                </Button>
                <div className="flex gap-2">
                  <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={async () => {
                      if (await run(() => deleteProject(removing.id), "Project deleted")) {
                        setRemoving(null);
                      }
                    }}
                  >
                    <Trash2 />
                    Delete
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** One form for create and edit — two would drift the moment a field is added. */
function ProjectDialog({
  open,
  onOpenChange,
  options,
  project,
  title,
  description,
  submitLabel,
  busy,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  options: ProjectOptions;
  project?: AdminProject;
  title: string;
  description: string;
  submitLabel: string;
  busy: boolean;
  onSubmit: (form: FormData) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await onSubmit(new FormData(e.currentTarget));
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-name">Project name</Label>
              <Input id="p-name" name="name" required defaultValue={project?.name} maxLength={120} />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="p-description">Description</Label>
              <Textarea
                id="p-description"
                name="description"
                rows={2}
                maxLength={600}
                defaultValue={project?.description}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-org">Client</Label>
                <select
                  id="p-org"
                  name="organizationId"
                  required
                  defaultValue={project?.organization_id ?? ""}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">Choose a client…</option>
                  {options.organizations.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-lead">Project lead</Label>
                <select
                  id="p-lead"
                  name="leadId"
                  defaultValue={project?.lead_id ?? ""}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  <option value="">Unassigned</option>
                  {options.leads.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.full_name || l.email}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-status">Status</Label>
                <select
                  id="p-status"
                  name="status"
                  defaultValue={project?.status ?? "Active"}
                  className="h-9.5 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-stage">Stage</Label>
                <Input
                  id="p-stage"
                  name="stage"
                  defaultValue={project?.stage}
                  placeholder="Discovery, Build, QA…"
                  maxLength={60}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-start">Start date</Label>
                <Input id="p-start" name="startDate" type="date" defaultValue={project?.start_date ?? ""} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-end">Target end</Label>
                <Input id="p-end" name="targetEnd" type="date" defaultValue={project?.target_end ?? ""} />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-budget">Budget</Label>
                <Input
                  id="p-budget"
                  name="budgetTotal"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={project?.budget_total ?? 0}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="p-spent">Spent to date</Label>
                <Input
                  id="p-spent"
                  name="budgetSpent"
                  type="number"
                  min={0}
                  step="0.01"
                  defaultValue={project?.budget_spent ?? 0}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={project?.featured}
                className="size-4 rounded border-line-strong"
              />
              Feature this project at the top of the client portal
            </label>
          </DialogBody>
          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button" />}>Cancel</DialogClose>
            <Button type="submit" disabled={busy}>
              {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" /> : <Check />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
