"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Time tracking for the staff portal.
 *
 * Time is always logged against the caller. The insert policy pins
 * `profile_id = auth.uid()`, so a staff member cannot bill hours in somebody
 * else's name even by crafting the request directly.
 */

export type TimeEntryRow = Database["public"]["Tables"]["time_entries"]["Row"];

export type TimeEntry = TimeEntryRow & {
  projectName: string | null;
  taskTitle: string | null;
};

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

export async function listTimeEntries(days = 30): Promise<TimeEntry[]> {
  noStore();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("time_entries")
    .select("*, project:projects ( name ), task:project_tasks ( title )")
    .gte("spent_on", since.toISOString().slice(0, 10))
    .order("spent_on", { ascending: false })
    .order("created_at", { ascending: false });

  return ((data ?? []) as unknown as (TimeEntryRow & {
    project: { name: string } | null;
    task: { title: string } | null;
  })[]).map((e) => ({
    ...e,
    projectName: e.project?.name ?? null,
    taskTitle: e.task?.title ?? null,
  }));
}

/**
 * Totals for the tracker header.
 *
 * Every figure is summed from the entries themselves. There is no target or
 * utilisation percentage here: the agency has no contracted weekly hours in the
 * database to divide by, and inventing one is how "93.3% utilisation" got onto
 * a dashboard in the first place.
 */
export async function timeTotals(): Promise<{
  todayMinutes: number;
  weekMinutes: number;
  monthMinutes: number;
  byProject: { project: string; minutes: number }[];
}> {
  const entries = await listTimeEntries(31);
  const today = new Date().toISOString().slice(0, 10);

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekFloor = weekAgo.toISOString().slice(0, 10);

  const byProject = new Map<string, number>();
  for (const e of entries) {
    const key = e.projectName ?? "Unassigned";
    byProject.set(key, (byProject.get(key) ?? 0) + e.minutes);
  }

  return {
    todayMinutes: entries.filter((e) => e.spent_on === today).reduce((s, e) => s + e.minutes, 0),
    weekMinutes: entries.filter((e) => e.spent_on >= weekFloor).reduce((s, e) => s + e.minutes, 0),
    monthMinutes: entries.reduce((s, e) => s + e.minutes, 0),
    byProject: [...byProject.entries()]
      .map(([project, minutes]) => ({ project, minutes }))
      .sort((a, b) => b.minutes - a.minutes),
  };
}

export async function logTime(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const minutes = Number(formData.get("minutes") ?? 0);
  if (!Number.isFinite(minutes) || minutes <= 0) return { error: "Enter how long you spent." };
  if (minutes > 1440) return { error: "A single entry cannot exceed 24 hours." };

  const spentOn = String(formData.get("spentOn") ?? "").trim();

  const { error } = await supabase.from("time_entries").insert({
    profile_id: user.id,
    project_id: (formData.get("projectId") as string) || null,
    task_id: (formData.get("taskId") as string) || null,
    minutes: Math.round(minutes),
    note: String(formData.get("note") ?? "").trim() || null,
    spent_on: spentOn || new Date().toISOString().slice(0, 10),
  });
  if (error) return { error: friendly(error.message, "log that time") };

  revalidatePath("/staff/time-tracker");
  return { ok: true };
}

export async function deleteTimeEntry(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id);
  if (error) return { error: friendly(error.message, "delete that entry") };

  revalidatePath("/staff/time-tracker");
  return { ok: true };
}
