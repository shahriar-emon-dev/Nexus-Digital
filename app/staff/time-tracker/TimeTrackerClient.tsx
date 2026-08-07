"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";

import { deleteTimeEntry, logTime, type TimeEntry } from "@/lib/supabase/time-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Logging and reviewing time.
 *
 * Minutes are entered as a number of minutes rather than a start/stop clock:
 * the database stores minutes, and a timer that has to survive a page reload
 * needs somewhere to persist its start — which would be a second source of
 * truth for the same fact.
 */
export function TimeTrackerClient({
  entries,
  projects,
}: {
  entries: TimeEntry[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await logTime(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      formRef.current?.reset();
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      await deleteTimeEntry(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
      <Card variant="glass" className="h-fit gap-5 rounded-2xl p-6">
        <h2 className="font-heading text-xl font-semibold text-ink">Log time</h2>

        <form ref={formRef} onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && (
            <p role="alert" className="text-[0.875rem] text-danger">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="minutes" className="text-[0.8125rem] font-medium text-ink">
              Minutes
            </label>
            <Input id="minutes" name="minutes" type="number" min={1} max={1440} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="spentOn" className="text-[0.8125rem] font-medium text-ink">
              Date
            </label>
            <Input
              id="spentOn"
              name="spentOn"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
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
              <option value="">Unassigned</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="note" className="text-[0.8125rem] font-medium text-ink">
              Note
            </label>
            <Input id="note" name="note" placeholder="What did you work on?" />
          </div>

          <Button type="submit" className="rounded-xl" disabled={pending}>
            {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
            Log it
          </Button>
        </form>
      </Card>

      <Card variant="glass" className="rounded-2xl p-6">
        <h2 className="mb-4 font-heading text-xl font-semibold text-ink">Recent entries</h2>

        {entries.length === 0 ? (
          <p className="py-12 text-center text-ink-tertiary">
            Nothing logged in the last 30 days.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[0.875rem]">
              <thead>
                <tr className="border-b border-line text-left text-[0.6875rem] tracking-wide text-ink-tertiary uppercase">
                  <th className="py-2 pr-3 font-semibold">Date</th>
                  <th className="py-2 pr-3 font-semibold">Project</th>
                  <th className="py-2 pr-3 font-semibold">Note</th>
                  <th className="py-2 pr-3 text-right font-semibold">Minutes</th>
                  <th className="py-2 sr-only">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-line-subtle last:border-0">
                    <td data-tabular className="py-2.5 pr-3 whitespace-nowrap text-ink-secondary">
                      {entry.spent_on}
                    </td>
                    <td className="py-2.5 pr-3 text-ink">{entry.projectName ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-ink-tertiary">{entry.note ?? "—"}</td>
                    <td data-tabular className="py-2.5 pr-3 text-right font-medium text-ink">
                      {entry.minutes}
                    </td>
                    <td className="py-2.5 text-right">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete entry from ${entry.spent_on}`}
                        onClick={() => onDelete(entry.id)}
                        disabled={pending}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
