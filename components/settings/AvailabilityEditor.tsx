"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { WEEKDAYS } from "@/lib/weekdays";
import {
  deleteAvailability,
  saveAvailability,
  type AvailabilityRow,
} from "@/lib/supabase/availability-actions";

/**
 * The hours you are bookable.
 *
 * Spec §7.1 asks for a booking calendar driven by "admin-configured working
 * hours". No such configuration existed anywhere, which is why /book-meeting
 * could only ever record an enquiry — there was nothing from which to compute a
 * slot. These rows are what `getOpenSlots()` intersects with the existing
 * calendar to produce the public grid.
 *
 * Publishing hours here is what turns the public page from a form into a
 * calendar. Until at least one person has hours, that page correctly keeps
 * behaving as a request form rather than inventing availability.
 */
export function AvailabilityEditor({ rules }: { rules: AvailabilityRow[] }) {
  const router = useRouter();
  const toast = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Resolved once on mount: the value is stored so a slot means the same thing
  // to the person who published it and the visitor who books it.
  const timezone = React.useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  }, []);

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("timezone", timezone);
    setError(null);

    startTransition(async () => {
      const result = await saveAvailability(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      toast.add({ title: "Hours published", type: "success" });
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteAvailability(id);
      router.refresh();
    });
  }

  const byDay = [...rules].sort(
    (a, b) => a.weekday - b.weekday || String(a.starts_at).localeCompare(String(b.starts_at))
  );

  return (
    <Card variant="glass" className="gap-5 rounded-2xl p-6">
      <div>
        <h2 className="flex items-center gap-2 font-heading text-lg font-semibold text-ink">
          <CalendarClock className="size-5 text-brand" aria-hidden />
          Bookable hours
        </h2>
        <p className="mt-1 max-w-prose text-sm text-ink-tertiary">
          Visitors can only book inside these windows, and never over something
          already in your calendar. Times are stored in {timezone}.
        </p>
      </div>

      {error && (
        <p role="alert" className="text-[0.875rem] text-danger">
          {error}
        </p>
      )}

      {byDay.length > 0 && (
        <ul className="flex flex-col gap-2">
          {byDay.map((rule) => (
            <li
              key={rule.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-line-subtle px-4 py-2.5"
            >
              <span className="text-sm text-ink-secondary">
                <span className="font-medium text-ink">{WEEKDAYS[rule.weekday]}</span>{" "}
                <span data-tabular className="text-ink-tertiary">
                  {String(rule.starts_at).slice(0, 5)}–{String(rule.ends_at).slice(0, 5)}
                </span>
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                disabled={pending}
                onClick={() => remove(rule.id)}
                aria-label={`Remove ${WEEKDAYS[rule.weekday]} ${String(rule.starts_at).slice(0, 5)}`}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={add} className="flex flex-wrap items-end gap-3 border-t border-line-subtle pt-5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="av-day" className="text-[0.8125rem] font-medium text-ink">
            Day
          </label>
          <Select name="weekday" defaultValue="1">
            <SelectTrigger id="av-day" className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day, i) => (
                <SelectItem key={day} value={String(i)}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="av-from" className="text-[0.8125rem] font-medium text-ink">
            From
          </label>
          <Input id="av-from" name="startsAt" type="time" defaultValue="09:00" required />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="av-to" className="text-[0.8125rem] font-medium text-ink">
            To
          </label>
          <Input id="av-to" name="endsAt" type="time" defaultValue="17:00" required />
        </div>

        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          <Plus />
          Add
        </Button>
      </form>
    </Card>
  );
}
