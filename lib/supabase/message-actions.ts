"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Messaging — one module, one source of truth.
 *
 * Replaces lib/messages.ts, which held three static arrays and threw away every
 * message the portal appeared to send.
 *
 * Unread counts are DERIVED from each participant's `last_read_at` marker
 * rather than stored as an integer. A stored counter has to be decremented by
 * whoever reads the channel, and the moment one of those paths is missed the
 * badge is permanently wrong.
 */

export type ChannelRow = Database["public"]["Tables"]["message_channels"]["Row"];
export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

/** The block shape the renderer already understands. */
export type MessageBlock =
  | { kind: "text"; text: string }
  | { kind: "code"; language: string; code: string }
  | { kind: "image"; src: string; alt: string }
  | { kind: "file"; name: string; size: string; format: string };

export type ChannelSummary = {
  id: string;
  name: string;
  purpose: string | null;
  projectId: string | null;
  isDirect: boolean;
  unread: number;
  lastMessageAt: string | null;
  participants: { id: string; name: string; avatarUrl: string | null }[];
};

export type ChannelMessage = {
  id: string;
  channelId: string;
  authorId: string | null;
  authorName: string;
  authorAvatar: string | null;
  blocks: MessageBlock[];
  sentAt: string;
  editedAt: string | null;
};

type Result = { ok: true } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb} here.`
    : `Could not ${verb}. ${message}`;

/* ------------------------------------------------------------- reading -- */

/**
 * Channels the signed-in user belongs to, newest activity first.
 *
 * RLS already restricts this to their own channels, so there is no user filter
 * in the query — adding one would imply the policy could not be trusted.
 */
export async function listChannels(): Promise<ChannelSummary[]> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: channels } = await supabase
    .from("message_channels")
    .select("id, name, purpose, project_id, is_direct")
    .order("updated_at", { ascending: false });

  const rows = channels ?? [];
  if (rows.length === 0) return [];

  const ids = rows.map((c) => c.id);

  // Three keyed queries rather than one embed: PostgREST cannot aggregate a
  // count per parent, and the unread figure needs a per-row comparison anyway.
  const [{ data: markers }, { data: recent }, { data: members }] = await Promise.all([
    supabase
      .from("channel_participants")
      .select("channel_id, last_read_at")
      .eq("profile_id", user.id),
    supabase
      .from("messages")
      .select("channel_id, created_at")
      .in("channel_id", ids)
      .order("created_at", { ascending: false }),
    supabase
      .from("channel_participants")
      .select("channel_id, profile:profiles ( id, full_name, email, avatar_url )")
      .in("channel_id", ids),
  ]);

  const readAt = new Map((markers ?? []).map((m) => [m.channel_id, m.last_read_at]));

  const unread = new Map<string, number>();
  const latest = new Map<string, string>();
  for (const m of recent ?? []) {
    if (!latest.has(m.channel_id)) latest.set(m.channel_id, m.created_at);
    const marker = readAt.get(m.channel_id) ?? "1970-01-01";
    if (m.created_at > marker) unread.set(m.channel_id, (unread.get(m.channel_id) ?? 0) + 1);
  }

  const people = new Map<string, ChannelSummary["participants"]>();
  for (const row of (members ?? []) as unknown as {
    channel_id: string;
    profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
  }[]) {
    if (!row.profile) continue;
    const list = people.get(row.channel_id) ?? [];
    list.push({
      id: row.profile.id,
      name: row.profile.full_name || row.profile.email,
      avatarUrl: row.profile.avatar_url,
    });
    people.set(row.channel_id, list);
  }

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    purpose: c.purpose,
    projectId: c.project_id,
    isDirect: c.is_direct,
    unread: unread.get(c.id) ?? 0,
    lastMessageAt: latest.get(c.id) ?? null,
    participants: people.get(c.id) ?? [],
  }));
}

/** Total unread across every channel — the sidebar badge. */
export async function totalUnread(): Promise<number> {
  const channels = await listChannels();
  return channels.reduce((sum, c) => sum + c.unread, 0);
}

export async function listMessages(channelId: string): Promise<ChannelMessage[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("messages")
    .select("id, channel_id, author_id, blocks, created_at, edited_at, author:profiles ( full_name, email, avatar_url )")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(300);

  return ((data ?? []) as unknown as {
    id: string;
    channel_id: string;
    author_id: string | null;
    blocks: MessageBlock[] | null;
    created_at: string;
    edited_at: string | null;
    author: { full_name: string | null; email: string; avatar_url: string | null } | null;
  }[]).map((m) => ({
    id: m.id,
    channelId: m.channel_id,
    authorId: m.author_id,
    // A deleted account leaves its messages behind; naming them "Unknown" is
    // better than rendering an empty byline.
    authorName: m.author?.full_name || m.author?.email || "Former member",
    authorAvatar: m.author?.avatar_url ?? null,
    blocks: m.blocks ?? [],
    sentAt: m.created_at,
    editedAt: m.edited_at,
  }));
}

/* ------------------------------------------------------------ mutations -- */

export async function sendMessage(channelId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const text = String(formData.get("body") ?? "").trim();
  if (!text) return { error: "Write something first." };
  if (text.length > 8000) return { error: "That message is too long." };

  // author_id is pinned by the insert policy too; sending it here just means
  // the row is correct rather than rejected.
  const { error } = await supabase.from("messages").insert({
    channel_id: channelId,
    author_id: user.id,
    blocks: [{ kind: "text", text }],
  });
  if (error) return { error: friendly(error.message, "post a message") };

  // Sending is also reading: leaving your own message unread is nonsense.
  await supabase
    .from("channel_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("profile_id", user.id);

  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return { ok: true };
}

export async function markChannelRead(channelId: string): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const { error } = await supabase
    .from("channel_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("profile_id", user.id);
  if (error) return { error: friendly(error.message, "mark this channel read") };

  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return { ok: true };
}
