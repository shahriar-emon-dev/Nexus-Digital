"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";

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
import { useToast } from "@/components/ui/toast";
import { createDeliverable } from "@/lib/supabase/deliverable-actions";

/**
 * Submits work for client review.
 *
 * The client-side review surface was complete — versions, pinned annotations,
 * resolve, approve, request-changes, realtime — sitting over a `deliverables`
 * table that nothing could write to. Staff had no way to submit anything, so
 * the table held zero rows and the entire approval loop was dead on arrival.
 *
 * The first version is created in the same action, atomically: a deliverable
 * with no version renders as an empty review canvas, which reads to a client as
 * a broken page rather than as "nothing uploaded yet".
 *
 * The asset is referenced by URL rather than uploaded here. Files already have
 * a home — `project_files` and the storage bucket behind it — and adding a
 * second upload path would mean two places to look for the same artefact.
 */
export function NewDeliverableDialog({
  projectId,
  projectName,
}: {
  projectId: string;
  projectName: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("projectId", projectId);
    setError(null);

    startTransition(async () => {
      const result = await createDeliverable(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setOpen(false);
      // A trigger notifies the client that something is waiting on them.
      toast.add({ title: "Sent for review", type: "success" });
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Upload />
            Send for review
          </Button>
        }
      />
      <DialogContent>
        <form onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>Send a deliverable for review</DialogTitle>
            <DialogDescription>
              The client on {projectName} is notified immediately and can approve
              it or request changes.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {error && (
              <p role="alert" className="text-[0.875rem] text-danger">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dl-title" className="text-[0.8125rem] font-medium text-ink">
                Title
              </label>
              <Input
                id="dl-title"
                name="title"
                required
                minLength={2}
                maxLength={200}
                placeholder="Homepage design — round 1"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="dl-discipline"
                  className="text-[0.8125rem] font-medium text-ink"
                >
                  Discipline
                </label>
                <Input id="dl-discipline" name="discipline" placeholder="Design, Copy…" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="dl-version" className="text-[0.8125rem] font-medium text-ink">
                  Version label
                </label>
                <Input id="dl-version" name="versionLabel" defaultValue="v1" required />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dl-url" className="text-[0.8125rem] font-medium text-ink">
                Asset link <span className="text-ink-tertiary">(optional)</span>
              </label>
              <Input
                id="dl-url"
                name="mediaUrl"
                type="url"
                placeholder="https://…"
              />
              <p className="text-xs text-ink-tertiary">
                A full http(s) URL — a shared file, a prototype, a preview
                deployment.
              </p>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dl-alt" className="text-[0.8125rem] font-medium text-ink">
                Image description <span className="text-ink-tertiary">(optional)</span>
              </label>
              {/* Alt text is asked for at the point of upload rather than
                  bolted on later, which is the only time anyone reliably
                  writes it. */}
              <Input id="dl-alt" name="alt" placeholder="What the image shows" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="dl-summary" className="text-[0.8125rem] font-medium text-ink">
                What changed
              </label>
              <textarea
                id="dl-summary"
                name="summary"
                rows={3}
                placeholder="What you would like them to look at."
                className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="ghost" type="button">Cancel</Button>} />
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
              Send for review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
