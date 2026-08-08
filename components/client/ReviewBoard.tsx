"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  MessageSquarePlus,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { boardColumns, type BoardColumn, type BoardTask } from "@/lib/client-portal";
import type { PersonDirectory } from "@/lib/supabase/staff-queries";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback, initials } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

const dotTone: Record<BoardColumn["tone"], string> = {
  neutral: "bg-ink-tertiary",
  ion: "bg-ion",
  brand: "bg-brand",
  orchid: "bg-chart-3",
};


/**
 * The client's read-only view of the delivery board.
 *
 * Read-only is the point: the columns are not drop targets, so they are plain
 * lists rather than the staff board's drag surface. The one thing the client
 * *can* do is sign off on what is waiting in Review, so that column is the only
 * one carrying an action.
 *
 * Column counts are derived from the tasks. The source markup hardcoded
 * "14" above two rendered cards.
 */
export function ReviewBoard({
  projectId,
  tasks,
  people,
  deliverableIdByTask = {},
}: {
  projectId: string;
  /** Supplied by the server from the database; RLS has already scoped it. */
  tasks: BoardTask[];
  /** Resolved on the server; see getPeopleDirectory for why. */
  people: PersonDirectory;
  /**
   * task id → deliverable id, resolved on the server.
   *
   * This used to come from a static module that mapped two invented tasks to
   * two invented deliverables, so the "Review deliverable" button either opened
   * a page about nothing or was hidden for work that genuinely had one.
   */
  deliverableIdByTask?: Record<string, string>;
}) {
  const [signedOff, setSignedOff] = React.useState<string[]>([]);

  // `open` is tracked separately from the task so the dialog keeps its content
  // through the 240ms exit transition. Clearing the task to close it instead
  // made the panel visibly empty out while it faded.
  const [reviewing, setReviewing] = React.useState<BoardTask | null>(null);
  const [open, setOpen] = React.useState(false);

  const columns = boardColumns.map((column) => ({
    ...column,
    tasks: tasks.filter((t) => t.column === column.id),
  }));

  const awaiting = tasks.filter((t) => t.awaitingApproval && !signedOff.includes(t.id));

  return (
    <div id="board" className="flex flex-col gap-8">
      {awaiting.length > 0 && (
        <Alert tone="info">
          <AlertTitle>
            {awaiting.length} deliverable{awaiting.length === 1 ? "" : "s"} waiting on you
          </AlertTitle>
          <AlertDescription>
            Work in the Review Required column is blocked until you sign off.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((column) => (
          <section key={column.id} className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
                {/* Two spans: the ping has to be a separate overlay, because
                    animating the dot itself scales it away to nothing. */}
                <span aria-hidden className="relative flex size-2 shrink-0">
                  {column.id === "review" && column.tasks.length > 0 && (
                    <span
                      className={cn(
                        "absolute inset-0 animate-ping rounded-full opacity-70 motion-reduce:animate-none",
                        dotTone[column.tone]
                      )}
                    />
                  )}
                  <span
                    className={cn("relative size-2 rounded-full", dotTone[column.tone])}
                  />
                </span>
                {column.title}
              </h3>
              <Badge
                variant={column.id === "review" ? "brand" : "default"}
                size="sm"
                data-tabular
              >
                {column.tasks.length}
                <span className="sr-only"> tasks</span>
              </Badge>
            </div>

            {column.tasks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-[0.8125rem] text-ink-tertiary">
                Nothing here.
              </p>
            ) : (
              <ul
                className={cn(
                  "flex flex-col gap-4",
                  column.id === "done" && "opacity-70"
                )}
              >
                {column.tasks.map((task) => (
                  <li key={task.id}>
                    <TaskCard
                      task={task}
                      people={people}
                      deliverableId={deliverableIdByTask[task.id]}
                      done={column.id === "done"}
                      signedOff={signedOff.includes(task.id)}
                      onReview={() => {
                        setReviewing(task);
                        setOpen(true);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      <SignOffDialog
        task={reviewing}
        people={people}
        open={open}
        onOpenChange={setOpen}
        onSignOff={(id) => {
          setSignedOff((prev) => (prev.includes(id) ? prev : [...prev, id]));
          setOpen(false);
        }}
      />
    </div>
  );
}

function TaskCard({
  task,
  people,
  deliverableId,
  done,
  signedOff,
  onReview,
}: {
  task: BoardTask;
  people: PersonDirectory;
  deliverableId?: string;
  done: boolean;
  signedOff: boolean;
  onReview: () => void;
}) {
  const assignee = people[task.assigneeId];
  const needsAction = Boolean(task.awaitingApproval) && !signedOff;

  return (
    <Card
      variant="glass"
      className={cn(
        "gap-4 rounded-2xl p-5",
        // The beam marks work that is blocked on the client, so it drops away
        // once they have signed off.
        needsAction && "border-beam"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h4
          className={cn(
            "font-heading leading-snug font-semibold",
            done ? "text-ink-tertiary line-through" : "text-ink"
          )}
        >
          {task.title}
        </h4>
        {done && <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-chart-3" aria-hidden />}
        {task.priority && !done && !signedOff && (
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-label="High priority"
          />
        )}
      </div>

      {task.description && (
        <p className="line-clamp-2 text-[0.8125rem] text-ink-tertiary">{task.description}</p>
      )}

      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" size="sm" className="tracking-wider uppercase">
          {task.discipline}
        </Badge>
        {assignee && (
          <Avatar size="sm" title={assignee.name}>
            <AvatarFallback aria-hidden>{initials(assignee.name)}</AvatarFallback>
            {/* Initials alone are read out letter by letter, so the name is
                carried in text for assistive tech and in `title` for pointers. */}
            <span className="sr-only">Assigned to {assignee.name}</span>
          </Avatar>
        )}
      </div>

      {task.awaitingApproval &&
        (signedOff ? (
          <p className="mt-auto flex items-center gap-2 border-t border-line-subtle pt-4 text-[0.8125rem] text-ink-secondary">
            <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
            Sign-off queued
          </p>
        ) : (
          <div className="mt-auto border-t border-line-subtle pt-4">
            {/* Where a real deliverable exists, the button opens the review
                canvas. The sign-off dialog is the fallback for tasks that have
                nothing to look at yet. */}
            {deliverableId ? (
              <Button
                size="sm"
                className={cn(
                  "w-full transition-transform hover:scale-[1.02]",
                  task.priority && "shadow-[0_0_20px_var(--brand-glow)]"
                )}
                render={<Link href={`/client/deliverables/${deliverableId}`} />}
              >
                Open review
                <ArrowRight />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={onReview}
                className={cn(
                  "w-full transition-transform hover:scale-[1.02]",
                  task.priority && "shadow-[0_0_20px_var(--brand-glow)]"
                )}
              >
                Review deliverable
                <ArrowRight />
              </Button>
            )}
          </div>
        ))}
    </Card>
  );
}

/**
 * Sign-off is UI-only until the deliverables API exists, so the confirmation
 * says exactly that rather than claiming the approval was recorded.
 */
function SignOffDialog({
  task,
  people,
  open,
  onOpenChange,
  onSignOff,
}: {
  task: BoardTask | null;
  people: PersonDirectory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignOff: (id: string) => void;
}) {
  const assignee = task ? people[task.assigneeId] : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        {task && (
          <>
            <DialogHeader>
              <DialogTitle>{task.title}</DialogTitle>
              <DialogDescription>
                {assignee
                  ? `Submitted by ${assignee.name}.`
                  : "Awaiting your approval."}
              </DialogDescription>
            </DialogHeader>

            <DialogBody className="flex flex-col gap-4">
              {task.description && <p className="text-ink-secondary">{task.description}</p>}
              <Alert tone="warning">
                <AlertTitle>Not yet recorded</AlertTitle>
                <AlertDescription>
                  {/* TODO: POST to /api/client once the deliverables mutation lands,
                      then replace this notice with the persisted approval state. */}
                  Approvals are queued in this session only. Nothing is written to
                  the project record until the deliverables API is connected.
                </AlertDescription>
              </Alert>
            </DialogBody>

            <DialogFooter>
              <Button variant="outline" render={<DialogClose />}>
                <MessageSquarePlus />
                Request changes
              </Button>
              <Button onClick={() => onSignOff(task.id)}>Queue sign-off</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
