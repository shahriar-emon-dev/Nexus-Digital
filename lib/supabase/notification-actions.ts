"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Notifications.
 *
 * There is no create function here on purpose. Notifications are raised by
 * database triggers (0052) through a SECURITY DEFINER writer, and the table has
 * no INSERT policy at all — a browser that can write into somebody else's inbox
 * is a phishing primitive. If a new event should notify someone, it gets a
 * trigger, not a call from application code.
 */

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

type Result = { ok: true } | { error: string };

export async function listNotifications(limit = 50): Promise<NotificationRow[]> {
  noStore();
  const supabase = await createClient();

  // RLS restricts this to the caller's own inbox, so no recipient filter here.
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as NotificationRow[];
}

export async function unreadNotificationCount(): Promise<number> {
  noStore();
  const supabase = await createClient();
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

export async function markNotificationRead(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) return { error: "Could not mark that as read." };

  revalidatePath("/staff/notifications");
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function markAllNotificationsRead(): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_id", user.id)
    .is("read_at", null);
  if (error) return { error: "Could not mark those as read." };

  revalidatePath("/staff/notifications");
  revalidatePath("/admin/notifications");
  return { ok: true };
}

export async function deleteNotification(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.from("notifications").delete().eq("id", id);
  if (error) return { error: "Could not dismiss that." };

  revalidatePath("/staff/notifications");
  revalidatePath("/admin/notifications");
  return { ok: true };
}
