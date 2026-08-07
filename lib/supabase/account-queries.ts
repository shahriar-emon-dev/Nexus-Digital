import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { ClientAccount, PortalKpi, PortalMeeting, PortalMessage } from "@/lib/client-portal";

/**
 * The signed-in client's own account, and the overview figures derived from it.
 *
 * Everything here is scoped by the caller's profile. `lib/client-portal.ts`
 * used to export a `clientAccount` constant, so every client saw "Northwind
 * Retail — Premium Tier, health 96" regardless of who they were.
 *
 * Not a `"use server"` module: these are reads called from server components,
 * and marking it would force every export to be an async action for no benefit.
 */

export async function getClientAccount(): Promise<ClientAccount | null> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id, full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  // A staff or admin account has no organisation. Returning null lets the
  // caller show their own name rather than an empty company card.
  if (!profile?.organization_id) {
    return {
      id: user.id,
      name: profile?.full_name || profile?.email || "Your account",
      tier: "Internal",
      health: null,
      welcome: null,
    };
  }

  const { data: org } = await supabase
    .from("organizations")
    .select("id, name, tier, health, notes")
    .eq("id", profile.organization_id)
    .maybeSingle();
  if (!org) return null;

  return {
    id: org.id,
    name: org.name,
    tier: org.tier ?? "Standard",
    health: (org.health as ClientAccount["health"]) ?? null,
    // The account manager's note, when there is one. No invented welcome copy.
    welcome: org.notes,
  };
}

/**
 * The overview KPI row.
 *
 * Every value is counted from a table. The version this replaces hardcoded
 * "Next Milestone: API Integration Layer — 4 Days Remaining" for every client,
 * so a card marked "Due soon" was showing a deadline that belonged to nobody.
 */
export async function getPortalKpis(): Promise<PortalKpi[]> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: projects }, { data: milestone }, { data: invoices }, { count: unreadMessages }] =
    await Promise.all([
      supabase.from("projects").select("id, status").neq("status", "Archived"),
      supabase
        .from("project_milestones")
        .select("title, due_date, project:projects ( name )")
        .gte("due_date", today)
        .order("due_date", { ascending: true })
        .limit(1)
        .maybeSingle(),
      // invoices holds no total: it is the sum of its line items less discount
      // plus tax, which invoice_totals computes. Two reads rather than an
      // embed, because PostgREST cannot join a view without FK metadata.
      supabase.from("invoices").select("id, status, due_date"),
      supabase.from("messages").select("id", { count: "exact", head: true }),
    ]);

  const active = (projects ?? []).filter((p) => p.status === "Active").length;

  const open = (invoices ?? []).filter((i) => i.status !== "paid" && i.status !== "void");
  const overdue = open.filter((i) => i.due_date && i.due_date < today);

  let outstandingTotal = 0;
  if (open.length > 0) {
    const { data: totals } = await supabase
      .from("invoice_totals")
      .select("invoice_id, outstanding")
      .in("invoice_id", open.map((i) => i.id));
    outstandingTotal = (totals ?? []).reduce((sum, t) => sum + Number(t.outstanding ?? 0), 0);
  }

  const kpis: PortalKpi[] = [
    {
      id: "projects",
      label: "Active Projects",
      value: active === 1 ? "1 Project" : `${active} Projects`,
      icon: "projects",
      tone: "brand",
      href: "/client/projects",
    },
  ];

  // Only shown when a dated milestone actually exists ahead of today.
  if (milestone) {
    const days = Math.max(
      0,
      Math.round((new Date(milestone.due_date as string).getTime() - Date.now()) / 86_400_000)
    );
    kpis.push({
      id: "milestone",
      label: "Next Milestone",
      value: milestone.title as string,
      note: days === 0 ? "Due today" : days === 1 ? "1 day remaining" : `${days} days remaining`,
      icon: "milestone",
      tone: "ion",
      href: "/client/projects",
      badge: days <= 7 ? { label: "Due soon", tone: "danger" } : undefined,
    });
  }

  kpis.push({
    id: "messages",
    label: "Messages",
    value:
      (unreadMessages ?? 0) === 1 ? "1 Message" : `${unreadMessages ?? 0} Messages`,
    icon: "messages",
    tone: "orchid",
    href: "/client/messages",
  });

  kpis.push({
    id: "billing",
    label: "Outstanding",
    value: new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(outstandingTotal),
    note: overdue.length > 0 ? `${overdue.length} overdue` : undefined,
    icon: "billing",
    tone: "brand",
    href: "/client/invoices",
    badge: overdue.length > 0 ? { label: "Overdue", tone: "danger" } : undefined,
  });

  return kpis;
}

/**
 * The overview's "Recent Communications" card.
 *
 * Only messages from other people — the card is about what the agency has said
 * to the client, so echoing their own replies back at them adds nothing.
 */
export async function getRecentMessages(limit = 3): Promise<PortalMessage[]> {
  noStore();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("messages")
    .select("id, blocks, created_at, author_id, author:profiles ( full_name, email, avatar_url )")
    .neq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const time = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  return ((data ?? []) as unknown as {
    id: string;
    blocks: { kind: string; text?: string }[] | null;
    created_at: string;
    author: { full_name: string | null; email: string; avatar_url: string | null } | null;
  }[]).map((m) => ({
    id: m.id,
    authorName: m.author?.full_name || m.author?.email || "Former member",
    authorAvatar: m.author?.avatar_url ?? null,
    time: time.format(new Date(m.created_at)),
    preview:
      m.blocks?.find((b) => b.kind === "text")?.text?.slice(0, 120) ?? "Shared an attachment",
  }));
}

/** The overview's meeting card, or null when nothing is scheduled. */
export async function getNextMeeting(): Promise<PortalMeeting | null> {
  noStore();
  const supabase = await createClient();

  const { data: meeting } = await supabase
    .from("meetings")
    .select("id, title, starts_at, duration_minutes")
    .gte("starts_at", new Date().toISOString())
    .neq("status", "Cancelled")
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!meeting) return null;

  const { data: people } = await supabase
    .from("meeting_participants")
    .select("profile:profiles ( id, full_name, email, avatar_url )")
    .eq("meeting_id", meeting.id);

  const starts = new Date(meeting.starts_at);
  const days = Math.round((starts.getTime() - Date.now()) / 86_400_000);
  const relative =
    days === 0 ? "Today" : days === 1 ? "Tomorrow" : days < 7 ? `In ${days} days` : null;

  return {
    title: meeting.title,
    when:
      relative ??
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
      }).format(starts),
    durationMinutes: meeting.duration_minutes,
    attendees: ((people ?? []) as unknown as {
      profile: { id: string; full_name: string | null; email: string; avatar_url: string | null } | null;
    }[])
      .filter((p) => p.profile)
      .map((p) => ({
        id: p.profile!.id,
        name: p.profile!.full_name || p.profile!.email,
        avatarUrl: p.profile!.avatar_url,
      })),
  };
}
