"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Meetings. Replaces lib/meetings.ts, which was a static array.
 *
 * Upcoming/past is decided by comparing `starts_at` to now at read time rather
 * than by a stored flag, so a meeting moves from one list to the other on its
 * own instead of waiting for something to run.
 */

export type MeetingRow = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingKind = Database["public"]["Enums"]["meeting_kind"];
export type MeetingStatus = Database["public"]["Enums"]["meeting_status"];

export type MeetingRecap = { summary: string; recordingMinutes: number; actions: string[] };

export type Meeting = Omit<MeetingRow, "recap"> & {
  attendees: { id: string; name: string; avatarUrl: string | null; response: string }[];
  projectName: string | null;
  projectSlug: string | null;
  /** Narrowed from Json: the shape is written by cancelMeeting/completeMeeting. */
  recap: MeetingRecap | null;
};

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

export async function listMeetings(): Promise<Meeting[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("meetings")
    .select("*, project:projects ( name, slug )")
    .order("starts_at", { ascending: true });

  const rows = (data ?? []) as unknown as (MeetingRow & {
    project: { name: string; slug: string } | null;
  })[];
  if (rows.length === 0) return [];

  const { data: people } = await supabase
    .from("meeting_participants")
    .select("meeting_id, response, profile:profiles ( id, full_name, email, avatar_url )")
    .in("meeting_id", rows.map((m) => m.id));

  const byMeeting = new Map<string, Meeting["attendees"]>();
  for (const row of (people ?? []) as unknown as {
    meeting_id: string;
    response: string;
    profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
  }[]) {
    if (!row.profile) continue;
    const list = byMeeting.get(row.meeting_id) ?? [];
    list.push({
      id: row.profile.id,
      name: row.profile.full_name || row.profile.email,
      avatarUrl: row.profile.avatar_url,
      response: row.response,
    });
    byMeeting.set(row.meeting_id, list);
  }

  return rows.map((m) => ({
    ...m,
    attendees: byMeeting.get(m.id) ?? [],
    projectName: m.project?.name ?? null,
    projectSlug: m.project?.slug ?? null,
    recap: (m.recap as MeetingRecap | null) ?? null,
  }));
}

/** Split at read time, so nothing has to run on a schedule to keep it true. */
export async function meetingBuckets(): Promise<{
  upcoming: Meeting[];
  past: Meeting[];
  next: Meeting | null;
  stats: { upcoming: number; thisWeek: number; totalMinutes: number };
}> {
  const all = await listMeetings();
  const now = Date.now();
  const weekOut = now + 7 * 24 * 60 * 60 * 1000;

  const upcoming = all
    .filter((m) => new Date(m.starts_at).getTime() >= now && m.status !== "Cancelled")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  const past = all
    .filter((m) => new Date(m.starts_at).getTime() < now || m.status === "Completed")
    .sort((a, b) => b.starts_at.localeCompare(a.starts_at));

  return {
    upcoming,
    past,
    next: upcoming[0] ?? null,
    stats: {
      upcoming: upcoming.length,
      thisWeek: upcoming.filter((m) => new Date(m.starts_at).getTime() <= weekOut).length,
      totalMinutes: upcoming.reduce((sum, m) => sum + m.duration_minutes, 0),
    },
  };
}

export async function createMeeting(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const title = String(formData.get("title") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  if (title.length < 2) return { error: "Give the meeting a title." };
  if (!startsAt) return { error: "Choose a date and time." };

  const when = new Date(startsAt);
  if (Number.isNaN(when.getTime())) return { error: "That date could not be read." };

  const agenda = String(formData.get("agenda") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const { data, error } = await supabase
    .from("meetings")
    .insert({
      title,
      kind: (String(formData.get("kind") ?? "Review") as MeetingKind) ?? "Review",
      starts_at: when.toISOString(),
      duration_minutes: Number(formData.get("durationMinutes") ?? 30) || 30,
      project_id: (formData.get("projectId") as string) || null,
      organization_id: (formData.get("organizationId") as string) || null,
      location: String(formData.get("location") ?? "").trim() || null,
      agenda,
      created_by: user.id,
    })
    .select("id")
    .single();
  if (error) return { error: friendly(error.message, "schedule that meeting") };

  // The organiser attends their own meeting. Inviting them here also means the
  // participants list is never empty, which every attendee query assumes.
  await supabase
    .from("meeting_participants")
    .insert({ meeting_id: data.id, profile_id: user.id, response: "accepted" });

  revalidatePath("/client/meetings");
  revalidatePath("/staff/meetings");
  return { ok: true };
}

export async function respondToMeeting(meetingId: string, response: string): Promise<Result> {
  if (!["accepted", "declined", "tentative"].includes(response)) {
    return { error: "That is not a valid response." };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase
    .from("meeting_participants")
    .update({ response })
    .eq("meeting_id", meetingId)
    .eq("profile_id", user.id);
  if (error) return { error: friendly(error.message, "record your response") };

  revalidatePath("/client/meetings");
  revalidatePath("/staff/meetings");
  return { ok: true };
}

export async function cancelMeeting(meetingId: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("meetings")
    .update({ status: "Cancelled" })
    .eq("id", meetingId);
  if (error) return { error: friendly(error.message, "cancel that meeting") };

  revalidatePath("/client/meetings");
  revalidatePath("/staff/meetings");
  return { ok: true };
}
