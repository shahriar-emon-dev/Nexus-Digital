import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * The staff workspace, read from Postgres.
 *
 * `app/staff/page.tsx` imported nothing from Supabase at all. It shipped seven
 * invented teammates (Marcus Vale, Sarah Quinn, Chen Liu…), two invented tasks
 * against clients that do not exist, an "Architecture Sync in 45 mins", "6.5h
 * Daily Hours", and a sprint scoreboard reading 142 commits / 28 PRs. None of
 * it was connected to anything.
 *
 * Everything below is counted or read. Where the database has no answer the
 * field is null and the screen omits the card rather than inventing one — there
 * is no commit or PR data in this system, so that panel is gone entirely rather
 * than being refilled with different made-up numbers.
 */

export type TaskRow = Database["public"]["Tables"]["project_tasks"]["Row"];

export type AssignedTask = TaskRow & {
  projectName: string | null;
  projectSlug: string | null;
};

export type StaffWorkspace = {
  displayName: string;
  /** Tasks assigned to the caller that are not finished. */
  tasks: AssignedTask[];
  /** Minutes the caller has logged today, from time_entries. */
  todayMinutes: number;
  /** The caller's next meeting, or null. */
  nextMeeting: {
    id: string;
    title: string;
    startsAt: string;
    durationMinutes: number;
    projectName: string | null;
  } | null;
  /** Everyone with a staff profile, for the presence rail. */
  team: { id: string; name: string }[];
  unreadNotifications: number;
};

export async function getStaffWorkspace(): Promise<StaffWorkspace> {
  noStore();
  const supabase = await createClient();

  const empty: StaffWorkspace = {
    displayName: "there",
    tasks: [],
    todayMinutes: 0,
    nextMeeting: null,
    team: [],
    unreadNotifications: 0,
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const today = new Date().toISOString().slice(0, 10);

  const [
    { data: profile },
    { data: tasks },
    { data: entries },
    { data: meeting },
    { data: team },
    { count: unread },
  ] = await Promise.all([
    supabase.from("profiles").select("full_name, email").eq("id", user.id).maybeSingle(),
    supabase
      .from("project_tasks")
      .select("*, project:projects ( name, slug )")
      .eq("assignee_id", user.id)
      .neq("column_id", "done")
      .order("priority", { ascending: false })
      .order("display_order")
      .limit(8),
    supabase.from("time_entries").select("minutes").eq("spent_on", today),
    supabase
      .from("meetings")
      .select("id, title, starts_at, duration_minutes, project:projects ( name )")
      .gte("starts_at", new Date().toISOString())
      .neq("status", "Cancelled")
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    // The presence rail. `public_staff` rather than `profiles`, so it shows the
    // roster and not every account that has ever signed in.
    supabase.from("public_staff").select("id, full_name").limit(12),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .is("read_at", null),
  ]);

  const firstName = (profile?.full_name ?? "").trim().split(/\s+/)[0];

  return {
    displayName: firstName || profile?.email || "there",
    tasks: ((tasks ?? []) as unknown as (TaskRow & {
      project: { name: string; slug: string } | null;
    })[]).map((t) => ({
      ...t,
      projectName: t.project?.name ?? null,
      projectSlug: t.project?.slug ?? null,
    })),
    todayMinutes: (entries ?? []).reduce((sum, e) => sum + e.minutes, 0),
    nextMeeting: meeting
      ? {
          id: meeting.id,
          title: meeting.title,
          startsAt: meeting.starts_at,
          durationMinutes: meeting.duration_minutes,
          projectName:
            (meeting as unknown as { project: { name: string } | null }).project?.name ?? null,
        }
      : null,
    team: ((team ?? []) as unknown as { id: string; full_name: string }[]).map((m) => ({
      id: m.id,
      name: m.full_name,
    })),
    unreadNotifications: unread ?? 0,
  };
}

/**
 * The staff project board.
 *
 * The board this replaces had four hardcoded columns and no rows at all — it
 * rendered the same empty kanban for everybody. Columns come from the
 * `board_column` enum the tasks are actually stored against, so a column can
 * never exist that no task could be in.
 */
export type BoardCard = AssignedTask & { assigneeName: string | null };

export async function getStaffBoard(): Promise<Record<string, BoardCard[]>> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("project_tasks")
    .select("*, project:projects ( name, slug ), assignee:profiles ( full_name, email )")
    .order("display_order");

  const grouped: Record<string, BoardCard[]> = {
    backlog: [],
    "in-progress": [],
    review: [],
    done: [],
  };

  for (const row of (data ?? []) as unknown as (TaskRow & {
    project: { name: string; slug: string } | null;
    assignee: { full_name: string | null; email: string } | null;
  })[]) {
    const card: BoardCard = {
      ...row,
      projectName: row.project?.name ?? null,
      projectSlug: row.project?.slug ?? null,
      assigneeName: row.assignee?.full_name || row.assignee?.email || null,
    };
    // A column id outside the four is not silently dropped — it lands in
    // backlog so the task stays visible rather than vanishing from the board.
    (grouped[row.column_id] ?? grouped.backlog).push(card);
  }

  return grouped;
}
