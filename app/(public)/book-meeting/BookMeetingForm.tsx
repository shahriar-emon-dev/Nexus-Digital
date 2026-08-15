"use client";

import * as React from "react";
import { CalendarCheck, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { submitLead } from "@/lib/supabase/lead-actions";
import type { DaySlots } from "@/lib/supabase/availability-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * A meeting request from a visitor.
 *
 * This records a LEAD rather than writing to `meetings` directly, and that is
 * deliberate: an anonymous visitor cannot create a meeting — the insert policy
 * requires a staff or admin session — and a public form that could would let
 * anyone put entries in the team's calendar.
 *
 * So the request lands in the CRM with a reference, and a human books it.
 */
export function BookMeetingForm({ days = [] }: { days?: DaySlots[] }) {
  const [reference, setReference] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [slot, setSlot] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    form.set("source", "book-meeting");

    // The chosen time rides along in the brief rather than in its own column.
    // A visitor cannot create a `meetings` row, so the preference has to reach
    // a human as part of the lead rather than as a booking that silently is not
    // one.
    if (slot) {
      const label = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      }).format(new Date(slot));
      form.set("brief", `Preferred time: ${label}\n\n${String(form.get("brief") ?? "")}`);
    }

    setError(null);
    startTransition(async () => {
      const result = await submitLead(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setReference(result.data.reference);
    });
  }

  if (reference !== null) {
    return (
      <Card variant="glass" className="items-center gap-4 rounded-2xl p-10 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-brand/10">
          <CalendarCheck className="size-7 text-brand" aria-hidden />
        </span>
        <h2 className="font-heading text-2xl font-semibold text-ink">Request received</h2>
        <p className="max-w-md text-ink-tertiary">
          We will come back with a couple of times that work. Quote{" "}
          <span data-tabular className="font-medium text-ink">
            {reference}
          </span>{" "}
          if you need to chase it.
        </p>
      </Card>
    );
  }

  return (
    <Card variant="glass" className="gap-5 rounded-2xl p-8">
      {/* Rendered only when somebody has published working hours. With none
          configured there is no such thing as an available slot, and an
          invented grid would mean confirming times nobody agreed to. */}
      {days.length > 0 && (
        <fieldset className="flex flex-col gap-3 border-b border-line-subtle pb-6">
          <legend className="mb-1 text-[0.8125rem] font-medium text-ink">
            Pick a time <span className="text-ink-tertiary">(optional)</span>
          </legend>

          <div className="flex flex-col gap-4">
            {days.slice(0, 7).map((day) => (
              <div key={day.date} className="flex flex-col gap-2">
                <p className="text-xs font-semibold tracking-wider text-ink-tertiary uppercase">
                  {day.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {day.slots.map((s) => {
                    const selected = slot === s.startsAt;
                    return (
                      <button
                        key={s.startsAt}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setSlot(selected ? null : s.startsAt)}
                        className={cn(
                          "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                          "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                          selected
                            ? "border-brand bg-brand font-medium text-brand-fg"
                            : "border-line bg-surface-sunken text-ink-secondary hover:border-brand-line hover:text-ink"
                        )}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-ink-tertiary">
            These are times the team is free. We confirm by email before anything
            goes in a calendar.
          </p>
        </fieldset>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        {error && (
          <p role="alert" className="text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="fullName" className="text-[0.8125rem] font-medium text-ink">
              Your name
            </label>
            <Input id="fullName" name="fullName" required minLength={2} autoComplete="name" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[0.8125rem] font-medium text-ink">
              Email
            </label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="company" className="text-[0.8125rem] font-medium text-ink">
              Company (optional)
            </label>
            <Input id="company" name="company" autoComplete="organization" />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="phone" className="text-[0.8125rem] font-medium text-ink">
              Phone (optional)
            </label>
            <Input id="phone" name="phone" type="tel" autoComplete="tel" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="brief" className="text-[0.8125rem] font-medium text-ink">
            What would you like to talk about?
          </label>
          <textarea
            id="brief"
            name="brief"
            rows={5}
            required
            minLength={10}
            placeholder="A sentence or two about the work, and any times that suit you."
            className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
          />
        </div>

        <Button type="submit" size="lg" className="w-fit rounded-xl" disabled={pending}>
          {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
          Request a meeting
        </Button>
      </form>
    </Card>
  );
}
