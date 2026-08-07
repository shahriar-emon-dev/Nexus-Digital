import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * Sidebar badge counts, resolved per request.
 *
 * Every one of these used to be a constant computed from a static file, so the
 * numbers a client saw belonged to a fictional company. They are counts against
 * the caller's own rows now, scoped by RLS rather than by a filter here.
 *
 * All three queries in each function run in parallel and use `head: true`, so
 * the badge costs three counts and no row transfer.
 */

export type ClientSidebarCounts = {
  activeProjects: number;
  unreadMessages: number;
  overdueInvoices: number;
};

export type StaffSidebarCounts = {
  assignedTasks: number;
  unreadMessages: number;
  unreadNotifications: number;
};

/** Messages posted by other people since the caller last read each channel. */
async function unreadMessageCount(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<number> {
  const { data: markers } = await supabase
    .from("channel_participants")
    .select("channel_id, last_read_at")
    .eq("profile_id", userId);

  if (!markers || markers.length === 0) return 0;

  // One query for every channel the user is in, then compared in memory. A
  // per-channel round trip would be one request per channel on every render.
  const { data: recent } = await supabase
    .from("messages")
    .select("channel_id, created_at, author_id")
    .in("channel_id", markers.map((m) => m.channel_id))
    .neq("author_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  const readAt = new Map(markers.map((m) => [m.channel_id, m.last_read_at]));
  return (recent ?? []).filter((m) => m.created_at > (readAt.get(m.channel_id) ?? "")).length;
}

export async function getClientSidebarCounts(): Promise<ClientSidebarCounts> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { activeProjects: 0, unreadMessages: 0, overdueInvoices: 0 };

  const today = new Date().toISOString().slice(0, 10);

  const [{ count: activeProjects }, unreadMessages, { count: overdueInvoices }] =
    await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("status", "Active"),
      unreadMessageCount(supabase, user.id),
      supabase
        .from("invoices")
        .select("id", { count: "exact", head: true })
        .lt("due_date", today)
        .not("status", "in", '("paid","void")'),
    ]);

  return {
    activeProjects: activeProjects ?? 0,
    unreadMessages,
    overdueInvoices: overdueInvoices ?? 0,
  };
}

export async function getStaffSidebarCounts(): Promise<StaffSidebarCounts> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { assignedTasks: 0, unreadMessages: 0, unreadNotifications: 0 };

  const [{ count: assignedTasks }, unreadMessages, { count: unreadNotifications }] =
    await Promise.all([
      supabase
        .from("project_tasks")
        .select("id", { count: "exact", head: true })
        .eq("assignee_id", user.id)
        .neq("column_id", "done"),
      unreadMessageCount(supabase, user.id),
      supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .is("read_at", null),
    ]);

  return {
    assignedTasks: assignedTasks ?? 0,
    unreadMessages,
    unreadNotifications: unreadNotifications ?? 0,
  };
}
