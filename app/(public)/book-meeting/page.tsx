import type { Metadata } from "next";
import { CalendarDays } from "lucide-react";

import { getOpenSlots } from "@/lib/supabase/availability-actions";
import { BookMeetingForm } from "./BookMeetingForm";

export const metadata: Metadata = {
  title: "Book a meeting",
  description: "Request a call with the Nexus team about your project.",
};

/**
 * Was a placeholder, while several buttons across the site pointed at it —
 * including the service pages' primary call to action, so the main conversion
 * path on the marketing site ended at a scaffold.
 *
 * It now offers real times when the team has published bookable hours, and
 * falls back to a request form when nobody has. That fallback is the honest
 * behaviour rather than a degraded one: with no working hours configured there
 * is no such thing as an available slot, and showing an invented grid would
 * mean confirming times nobody agreed to.
 *
 * A visitor still cannot write to `meetings` — the insert policy is staff and
 * admin only, deliberately, or anyone could put entries in the team's calendar.
 * Choosing a slot attaches a preferred time to the enquiry; a human confirms it.
 */
export default async function BookMeetingPage() {
  const days = await getOpenSlots(14, 30);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 md:px-10">
      <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-brand/10">
        <CalendarDays className="size-7 text-brand" aria-hidden />
      </span>

      <h1 className="font-heading text-[2.75rem] leading-tight font-bold tracking-tight text-balance text-ink">
        Let&rsquo;s find a time
      </h1>
      <p className="mt-4 mb-10 max-w-xl text-lg leading-relaxed text-ink-secondary">
        {days.length > 0
          ? "Pick a time that suits you and tell us what you are working on. We will confirm by email."
          : "Tell us what you are working on and we will come back with a couple of slots. No calendar gymnastics, and nothing automated pretending to be a person."}
      </p>

      <BookMeetingForm days={days} />
    </div>
  );
}
