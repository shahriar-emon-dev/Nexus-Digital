"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
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
import { createTask } from "@/lib/supabase/task-actions";

/**
 * Adds a card to the board.
 *
 * The board could move cards and never create one: `task-actions.ts` exported
 * `moveTask` and `setTaskAssignee` and nothing else, so every task in the
 * system arrived through `seed/demo_projects.sql`. A Kanban board that cannot
 * add work is a viewer, and the staff portal's central screen was one.
 *
 * The project is required rather than inferred. This board spans every project
 * the caller can see, so there is no single "current" project to default to,
 * and guessing would silently file work against the wrong engagement.
 */
export function NewTaskDialog({
  projects,
  assignees,
}: {
  projects: { id: string; name: string }[];
  assignees: { id: string; name: string }[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await createTask(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      toast.add({ title: "Task created", type: "success" });
      router.refresh();
    });
  }

  if (projects.length === 0) {
    // Nothing to file work against. Offering the dialog would end in a
    // validation error the person cannot resolve from here.
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus />
            New task
          </Button>
        }
      />
      <DialogContent className="max-w-lg">
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>New task</DialogTitle>
            <DialogDescription>
              Cards are visible to everyone on the project, including the client
              on their read-only board.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {error && (
              <p role="alert" className="text-[0.875rem] text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-title" className="text-[0.8125rem] font-medium text-ink">
                Title
              </label>
              <Input id="task-title" name="title" required minLength={2} maxLength={200} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-project" className="text-[0.8125rem] font-medium text-ink">
                  Project
                </label>
                <Select name="projectId" defaultValue={projects[0].id}>
                  <SelectTrigger id="task-project">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-column" className="text-[0.8125rem] font-medium text-ink">
                  Column
                </label>
                <Select name="columnId" defaultValue="backlog">
                  <SelectTrigger id="task-column">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="backlog">Backlog</SelectItem>
                    <SelectItem value="in-progress">In progress</SelectItem>
                    <SelectItem value="review">In review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="task-discipline"
                  className="text-[0.8125rem] font-medium text-ink"
                >
                  Discipline
                </label>
                <Input
                  id="task-discipline"
                  name="discipline"
                  placeholder="Engineering, Design…"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="task-assignee" className="text-[0.8125rem] font-medium text-ink">
                  Assignee
                </label>
                {/* A trigger notifies whoever is chosen, so this is not merely
                    a label — leaving it unassigned is a real state. */}
                <Select name="assigneeId" defaultValue="">
                  <SelectTrigger id="task-assignee">
                    <SelectValue placeholder="Unassigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Unassigned</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="task-description" className="text-[0.8125rem] font-medium text-ink">
                Description
              </label>
              <textarea
                id="task-description"
                name="description"
                rows={3}
                className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              />
            </div>

            <label className="flex items-center gap-2.5 text-[0.875rem] text-ink-secondary">
              <input
                type="checkbox"
                name="priority"
                className="size-4 rounded border-line accent-[var(--brand)]"
              />
              Flag as urgent
            </label>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button">Cancel</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
              Create task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
