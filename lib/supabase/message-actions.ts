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

/**
 * People a staff member or admin may open a conversation with.
 *
 * A channel is created with its participants attached, so this list decides
 * who can be pulled into one. RLS on `profiles` restricts a non-admin to their
 * own row, so a staff member sees a short list and an admin sees everyone —
 * which is the correct behaviour rather than something to work around.
 */
export type ChannelCandidate = {
  id: string;
  name: string;
  email: string;
  portal: string;
  organizationName: string | null;
};

export async function listChannelCandidates(): Promise<ChannelCandidate[]> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, portal, organizations ( name )")
    .neq("id", user.id)
    .eq("is_active", true)
    .order("full_name");

  return ((data ?? []) as unknown as {
    id: string;
    full_name: string | null;
    email: string;
    portal: string;
    organizations: { name: string } | null;
  }[]).map((p) => ({
    id: p.id,
    name: p.full_name || p.email,
    email: p.email,
    portal: p.portal,
    organizationName: p.organizations?.name ?? null,
  }));
}

/**
 * Opens a conversation.
 *
 * This is the operation the messaging system was missing entirely. Every read
 * path, the unread derivation, the realtime subscription and the composer were
 * written and correct, and there was no way to create the row they all hang
 * off — so `message_channels` held zero rows and the feature was unreachable.
 *
 * The creator is always enrolled. The select policy is `in_channel()`, so a
 * channel whose creator forgot to add themselves would vanish the instant it
 * was made.
 */
export async function createChannel(
  formData: FormData
): Promise<{ error: string } | { ok: true; id: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const name = String(formData.get("name") ?? "").trim();
  const purpose = String(formData.get("purpose") ?? "").trim() || null;
  const projectId = String(formData.get("projectId") ?? "").trim() || null;
  const participantIds = formData
    .getAll("participantIds")
    .map((v) => String(v))
    .filter(Boolean);

  if (name.length < 2) return { error: "Give the channel a name." };
  if (name.length > 120) return { error: "That name is too long." };

  const { data: channel, error } = await supabase
    .from("message_channels")
    .insert({
      name,
      purpose,
      project_id: projectId,
      is_direct: false,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !channel) {
    return { error: friendly(error?.message ?? "Unknown error", "create a channel") };
  }

  const members = Array.from(new Set([user.id, ...participantIds]));
  const { error: memberError } = await supabase
    .from("channel_participants")
    .insert(members.map((profile_id) => ({ channel_id: channel.id, profile_id })));

  if (memberError) {
    // A channel nobody is in is invisible even to its creator. Roll back rather
    // than leave an unreachable row behind.
    await supabase.from("message_channels").delete().eq("id", channel.id);
    return { error: friendly(memberError.message, "add people to the channel") };
  }

  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return { ok: true, id: channel.id };
}

/** Adds people to an existing channel. Already-present members are ignored. */
export async function addParticipants(
  channelId: string,
  participantIds: string[]
): Promise<Result> {
  const supabase = await createClient();
  if (participantIds.length === 0) return { error: "Choose at least one person." };

  const { data: existing } = await supabase
    .from("channel_participants")
    .select("profile_id")
    .eq("channel_id", channelId);

  const already = new Set((existing ?? []).map((r) => r.profile_id));
  const toAdd = participantIds.filter((id) => !already.has(id));
  if (toAdd.length === 0) return { ok: true };

  const { error } = await supabase
    .from("channel_participants")
    .insert(toAdd.map((profile_id) => ({ channel_id: channelId, profile_id })));
  if (error) return { error: friendly(error.message, "add people to this channel") };

  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return { ok: true };
}

/**
 * Guarantees a project has a conversation, and returns its id.
 *
 * Called when a project is created, so a client never lands in a portal whose
 * Messages tab is empty with no way to start one — clients cannot create
 * channels themselves, by policy.
 */
export async function ensureProjectChannel(projectId: string): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("message_channels")
    .select("id")
    .eq("project_id", projectId)
    .limit(1)
    .maybeSingle();
  if (existing) return existing.id;

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, organization_id, lead_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: channel, error } = await supabase
    .from("message_channels")
    .insert({
      name: project.name,
      purpose: "Project conversation",
      project_id: project.id,
      organization_id: project.organization_id,
      is_direct: false,
      created_by: user?.id ?? null,
    })
    .select("id")
    .single();
  if (error || !channel) return null;

  const [assigned, clients] = await Promise.all([
    supabase.from("project_assignments").select("profile_id").eq("project_id", project.id),
    project.organization_id
      ? supabase
          .from("profiles")
          .select("id")
          .eq("organization_id", project.organization_id)
          .eq("is_active", true)
      : Promise.resolve({ data: [] as { id: string }[] }),
  ]);

  const members = Array.from(
    new Set(
      [
        user?.id ?? null,
        project.lead_id,
        ...(assigned.data ?? []).map((a) => a.profile_id),
        ...((clients.data ?? []) as { id: string }[]).map((c) => c.id),
      ].filter((v): v is string => Boolean(v))
    )
  );

  if (members.length > 0) {
    await supabase
      .from("channel_participants")
      .insert(members.map((profile_id) => ({ channel_id: channel.id, profile_id })));
  }

  revalidatePath("/client/messages");
  revalidatePath("/staff/messages");
  return channel.id;
}

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
