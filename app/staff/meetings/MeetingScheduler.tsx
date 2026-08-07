"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader2 } from "lucide-react";

import { createMeeting } from "@/lib/supabase/meeting-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Scheduling a meeting.
 *
 * The organiser is added as an accepted participant by the action, not here —
 * every attendee query assumes the list is never empty, and doing it server
 * side means it holds even if a meeting is created some other way.
 */
export function MeetingScheduler({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await createMeeting(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button className="w-fit rounded-xl" onClick={() => setOpen(true)}>
        <CalendarPlus />
        Schedule a meeting
      </Button>
    );
  }

  return (
    <Card variant="glass" className="gap-4 rounded-2xl p-6">
      <h2 className="font-heading text-lg font-semibold text-ink">Schedule a meeting</h2>

      <form ref={formRef} onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        {error && (
          <p role="alert" className="sm:col-span-2 text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="title" className="text-[0.8125rem] font-medium text-ink">
            Title
          </label>
          <Input id="title" name="title" required minLength={2} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="startsAt" className="text-[0.8125rem] font-medium text-ink">
            Starts
          </label>
          {/* datetime-local submits the browser's local time; the action converts
              to an ISO instant so the stored value is unambiguous. */}
          <Input id="startsAt" name="startsAt" type="datetime-local" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="durationMinutes" className="text-[0.8125rem] font-medium text-ink">
            Duration (minutes)
          </label>
          <Input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={5}
            max={600}
            defaultValue={30}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="kind" className="text-[0.8125rem] font-medium text-ink">
            Kind
          </label>
          <select
            id="kind"
            name="kind"
            defaultValue="Review"
            className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          >
            <option>Review</option>
            <option>Workshop</option>
            <option>Standup</option>
            <option>Handover</option>
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="projectId" className="text-[0.8125rem] font-medium text-ink">
            Project
          </label>
          <select
            id="projectId"
            name="projectId"
            className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          >
            <option value="">None</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="agenda" className="text-[0.8125rem] font-medium text-ink">
            Agenda — one item per line
          </label>
          <textarea
            id="agenda"
            name="agenda"
            rows={3}
            className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          />
        </div>

        <div className="flex gap-3 sm:col-span-2">
          <Button type="submit" className="rounded-xl" disabled={pending}>
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Schedule
          </Button>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
