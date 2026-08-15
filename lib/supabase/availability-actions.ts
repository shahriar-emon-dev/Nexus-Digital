"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Bookable hours, and the slot grid derived from them.
 *
 * Spec §7.1 asks for a calendar "showing available slots based on
 * admin-configured working hours". There were no working hours anywhere in the
 * system, so /book-meeting could only ever be a contact form. Migration 0062
 * added `availability_rules`; this turns them into concrete slots.
 *
 * Slots are COMPUTED, never stored. A stored slot table has to be regenerated
 * whenever a rule changes or a meeting is booked, and every bug in that
 * regeneration shows up as a visitor being offered a time that is already gone.
 * Deriving on read means the grid cannot disagree with the calendar.
 */

export type AvailabilityRow = Database["public"]["Tables"]["availability_rules"]["Row"];

type Result = { ok: true } | { error: string };

export type Slot = {
  /** ISO instant the slot begins. */
  startsAt: string;
  /** Local-time label, pre-formatted so the client component stays dumb. */
  label: string;
  durationMinutes: number;
};

export type DaySlots = { date: string; label: string; slots: Slot[] };

/* ------------------------------------------------------------- reading -- */

export async function listAvailability(profileId?: string): Promise<AvailabilityRow[]> {
  noStore();
  const supabase = await createClient();

  let query = supabase
    .from("availability_rules")
    .select("*")
    .order("weekday")
    .order("starts_at");
  if (profileId) query = query.eq("profile_id", profileId);

  const { data } = await query;
  return (data ?? []) as AvailabilityRow[];
}

/** My own rules — the staff settings screen. */
export async function listMyAvailability(): Promise<AvailabilityRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  return listAvailability(user.id);
}

/**
 * The public booking grid: the next `days` days of free slots.
 *
 * Anything already booked is removed by comparing against `meetings`, which an
 * anonymous visitor cannot read directly — so this runs the comparison server
 * side and returns only the free times. A visitor learns when the agency is
 * free, never who it is meeting.
 */
export async function getOpenSlots(days = 14, slotMinutes = 30): Promise<DaySlots[]> {
  noStore();
  const supabase = await createClient();

  const { data: rules } = await supabase
    .from("availability_rules")
    .select("weekday, starts_at, ends_at")
    .eq("is_active", true);

  if (!rules || rules.length === 0) return [];

  const from = new Date();
  const until = new Date(from.getTime() + days * 86_400_000);

  const { data: booked } = await supabase
    .from("meetings")
    .select("starts_at, duration_minutes")
    .gte("starts_at", from.toISOString())
    .lte("starts_at", until.toISOString())
    .neq("status", "Cancelled");

  // Busy intervals as epoch pairs; cheaper than re-parsing dates in the loop.
  const busy = ((booked ?? []) as { starts_at: string; duration_minutes: number }[]).map((m) => {
    const start = new Date(m.starts_at).getTime();
    return [start, start + (m.duration_minutes || 30) * 60_000] as const;
  });

  const dayFmt = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

  const out: DaySlots[] = [];

  for (let d = 0; d < days; d += 1) {
    const day = new Date(from.getTime() + d * 86_400_000);
    const weekday = day.getDay();
    const todaysRules = rules.filter((r) => r.weekday === weekday);
    if (todaysRules.length === 0) continue;

    const slots: Slot[] = [];

    for (const rule of todaysRules) {
      const [sh, sm] = String(rule.starts_at).split(":").map(Number);
      const [eh, em] = String(rule.ends_at).split(":").map(Number);

      const cursor = new Date(day);
      cursor.setHours(sh, sm ?? 0, 0, 0);
      const end = new Date(day);
      end.setHours(eh, em ?? 0, 0, 0);

      while (cursor.getTime() + slotMinutes * 60_000 <= end.getTime()) {
        const startMs = cursor.getTime();
        const endMs = startMs + slotMinutes * 60_000;

        // Never offer a time in the past — the loop starts today, so the first
        // day's early slots would otherwise still be listed.
        const inPast = startMs <= Date.now();
        const clashes = busy.some(([bs, be]) => startMs < be && endMs > bs);

        if (!inPast && !clashes) {
          slots.push({
            startsAt: new Date(startMs).toISOString(),
            label: timeFmt.format(new Date(startMs)),
            durationMinutes: slotMinutes,
          });
        }
        cursor.setTime(endMs);
      }
    }

    if (slots.length > 0) {
      out.push({ date: day.toISOString().slice(0, 10), label: dayFmt.format(day), slots });
    }
  }

  return out;
}

/* ----------------------------------------------------------- mutations -- */

export async function saveAvailability(formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const weekday = Number(formData.get("weekday"));
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const profileId = String(formData.get("profileId") ?? "").trim() || user.id;

  if (!Number.isInteger(weekday) || weekday < 0 || weekday > 6) {
    return { error: "Choose a day of the week." };
  }
  if (!/^\d{2}:\d{2}$/.test(startsAt) || !/^\d{2}:\d{2}$/.test(endsAt)) {
    return { error: "Enter times as HH:MM." };
  }
  if (endsAt <= startsAt) return { error: "The end time must be after the start time." };

  const { error } = await supabase.from("availability_rules").upsert(
    {
      profile_id: profileId,
      weekday,
      starts_at: startsAt,
      ends_at: endsAt,
      timezone: String(formData.get("timezone") ?? "UTC"),
      is_active: true,
    },
    { onConflict: "profile_id,weekday,starts_at" }
  );

  if (error) {
    return {
      error: error.message.toLowerCase().includes("row-level security")
        ? "You can only set your own hours."
        : error.message,
    };
  }

  revalidatePath("/staff/settings");
  revalidatePath("/book-meeting");
  return { ok: true };
}

export async function deleteAvailability(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("availability_rules").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/staff/settings");
  revalidatePath("/book-meeting");
  return { ok: true };
}
