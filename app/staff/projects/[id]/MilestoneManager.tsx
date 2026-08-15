"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  createMilestone,
  deleteMilestone,
  setMilestoneStatus,
  updateMilestone,
  type ProjectMilestone,
} from "@/lib/supabase/milestone-actions";

const STATUSES = ["upcoming", "active", "done", "final"] as const;

const statusTone: Record<string, "default" | "brand" | "success" | "warning"> = {
  upcoming: "default",
  active: "warning",
  done: "success",
  final: "brand",
};

/**
 * Milestone authoring on the project.
 *
 * `project_milestones` was readable and nothing else — no INSERT, UPDATE or
 * DELETE path existed anywhere in the application, and its write policies were
 * admin-only. Every milestone in the database arrived from
 * `seed/demo_projects.sql`, which meant the client Milestone Roadmap, the
 * project timeline and the "Next Milestone" KPI on the client overview were
 * three visible features permanently frozen against demo rows.
 *
 * Migration 0061 opened the policies to staff who can see the project and put
 * the table in the realtime publication; this is the surface that uses both, so
 * a client watching their roadmap sees a phase close as it happens.
 */
export function MilestoneManager({
  projectId,
  milestones,
}: {
  projectId: string;
  milestones: ProjectMilestone[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = React.useState<ProjectMilestone | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  useRealtime(
    "staff:milestones",
    [{ table: "project_milestones", filter: `project_id=eq.${projectId}` }],
    () => router.refresh()
  );

  function submit(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("projectId", projectId);
    setError(null);

    startTransition(async () => {
      const result = id ? await updateMilestone(id, form) : await createMilestone(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setEditing(null);
      setCreating(false);
      toast.add({ title: id ? "Milestone updated" : "Milestone added", type: "success" });
      router.refresh();
    });
  }

  function advance(m: ProjectMilestone) {
    startTransition(async () => {
      // Reaching "done" also pins progress to 100 in the action — a completed
      // phase with a half-filled bar is a contradiction the roadmap renders.
      const result = await setMilestoneStatus(m.id, m.status === "done" ? "active" : "done");
      if ("error" in result) {
        toast.add({ title: result.error, type: "error" });
        return;
      }
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteMilestone(id);
      if ("error" in result) {
        toast.add({ title: result.error, type: "error" });
        return;
      }
      toast.add({ title: "Milestone removed", type: "success" });
      router.refresh();
    });
  }

  const form = (m: ProjectMilestone | null) => (
    <form onSubmit={(e) => submit(e, m?.id)}>
      <DialogHeader>
        <DialogTitle>{m ? "Edit milestone" : "New milestone"}</DialogTitle>
        <DialogDescription>
          Milestones drive the client&rsquo;s roadmap and the &ldquo;next
          milestone&rdquo; card on their overview.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-4 py-4">
        {error && (
          <p role="alert" className="text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ms-title" className="text-[0.8125rem] font-medium text-ink">
            Title
          </label>
          <Input
            id="ms-title"
            name="title"
            required
            minLength={2}
            maxLength={200}
            defaultValue={m?.title ?? ""}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="ms-phase" className="text-[0.8125rem] font-medium text-ink">
              Phase
            </label>
            <Input
              id="ms-phase"
              name="phase"
              required
              defaultValue={m?.phase ?? ""}
              placeholder="Discovery, Build…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ms-status" className="text-[0.8125rem] font-medium text-ink">
              Status
            </label>
            <Select name="status" defaultValue={m?.status ?? "upcoming"}>
              <SelectTrigger id="ms-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ms-due" className="text-[0.8125rem] font-medium text-ink">
              Due date
            </label>
            <Input id="ms-due" name="dueDate" type="date" defaultValue={m?.due_date ?? ""} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="ms-progress" className="text-[0.8125rem] font-medium text-ink">
              Progress %
            </label>
            {/* Empty is a real state — "not started measuring" rather than 0. */}
            <Input
              id="ms-progress"
              name="progress"
              type="number"
              min={0}
              max={100}
              defaultValue={m?.progress ?? ""}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="ms-desc" className="text-[0.8125rem] font-medium text-ink">
            Description
          </label>
          <textarea
            id="ms-desc"
            name="description"
            rows={3}
            defaultValue={m?.description ?? ""}
            className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          />
        </div>
      </div>

      <DialogFooter>
        <DialogClose render={<Button variant="ghost" type="button">Cancel</Button>} />
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          {m ? "Save" : "Add milestone"}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Card variant="glass" className="gap-4 rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-ink">Milestones</h2>
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogTrigger
            render={
              <Button size="sm">
                <Plus />
                Add milestone
              </Button>
            }
          />
          <DialogContent>{form(null)}</DialogContent>
        </Dialog>
      </div>

      {milestones.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line-strong px-4 py-8 text-center text-sm text-ink-tertiary">
          No milestones yet. The client&rsquo;s roadmap stays empty until this
          project has some.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {milestones.map((m) => (
            <li
              key={m.id}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-line-subtle px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className={cn("font-medium text-ink", m.status === "done" && "line-through")}>
                  {m.title}
                </p>
                <p className="text-xs text-ink-tertiary">
                  {m.phase}
                  {m.due_date ? ` · due ${m.due_date}` : ""}
                  {m.progress !== null ? ` · ${m.progress}%` : ""}
                </p>
              </div>

              <Badge variant={statusTone[m.status] ?? "default"}>{m.status}</Badge>

              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => advance(m)}
                  aria-label={m.status === "done" ? `Reopen ${m.title}` : `Complete ${m.title}`}
                >
                  <Check />
                </Button>

                <Dialog
                  open={editing?.id === m.id}
                  onOpenChange={(o) => setEditing(o ? m : null)}
                >
                  <DialogTrigger
                    render={
                      <Button variant="ghost" size="icon-sm" aria-label={`Edit ${m.title}`}>
                        <Pencil />
                      </Button>
                    }
                  />
                  <DialogContent>{form(m)}</DialogContent>
                </Dialog>

                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={pending}
                  onClick={() => remove(m.id)}
                  aria-label={`Delete ${m.title}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
