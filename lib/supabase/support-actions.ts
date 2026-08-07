"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * Support tickets, shared by the client, staff and admin support screens.
 *
 * Replies carry an `is_internal` flag. A staff note is filtered out by RLS
 * rather than by this module, so a mistake here cannot leak one — the client
 * simply never receives the row.
 */

export type TicketRow = Database["public"]["Tables"]["support_tickets"]["Row"];
export type TicketStatus = Database["public"]["Enums"]["ticket_status"];
export type ReplyRow = Database["public"]["Tables"]["support_ticket_replies"]["Row"];

export type Ticket = TicketRow & {
  openedByName: string | null;
  assigneeName: string | null;
  replyCount: number;
};

export type TicketReply = ReplyRow & { authorName: string };

type Result = { ok: true; reference?: string } | { error: string };

const friendly = (message: string, verb: string) =>
  message.toLowerCase().includes("row-level security")
    ? `You do not have permission to ${verb}.`
    : `Could not ${verb}. ${message}`;

export async function listTickets(): Promise<Ticket[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("support_tickets")
    .select("*, opener:profiles!support_tickets_opened_by_fkey ( full_name, email ), assignee:profiles!support_tickets_assignee_id_fkey ( full_name, email )")
    .order("created_at", { ascending: false });

  const rows = (data ?? []) as unknown as (TicketRow & {
    opener: { full_name: string | null; email: string } | null;
    assignee: { full_name: string | null; email: string } | null;
  })[];
  if (rows.length === 0) return [];

  const { data: replies } = await supabase
    .from("support_ticket_replies")
    .select("ticket_id")
    .in("ticket_id", rows.map((t) => t.id));

  const counts = new Map<string, number>();
  for (const r of replies ?? []) counts.set(r.ticket_id, (counts.get(r.ticket_id) ?? 0) + 1);

  return rows.map((t) => ({
    ...t,
    openedByName: t.opener?.full_name || t.opener?.email || null,
    assigneeName: t.assignee?.full_name || t.assignee?.email || null,
    replyCount: counts.get(t.id) ?? 0,
  }));
}

export async function listReplies(ticketId: string): Promise<TicketReply[]> {
  noStore();
  const supabase = await createClient();

  const { data } = await supabase
    .from("support_ticket_replies")
    .select("*, author:profiles ( full_name, email )")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  return ((data ?? []) as unknown as (ReplyRow & {
    author: { full_name: string | null; email: string } | null;
  })[]).map((r) => ({
    ...r,
    authorName: r.author?.full_name || r.author?.email || "Former member",
  }));
}

/** Counts for the support header. Derived, so they cannot drift from the list. */
export async function ticketStats(): Promise<{
  open: number;
  pending: number;
  resolved: number;
  total: number;
}> {
  const tickets = await listTickets();
  return {
    open: tickets.filter((t) => t.status === "open").length,
    pending: tickets.filter((t) => t.status === "pending").length,
    resolved: tickets.filter((t) => t.status === "resolved" || t.status === "closed").length,
    total: tickets.length,
  };
}

export async function openTicket(formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (subject.length < 3) return { error: "Give your request a subject." };
  if (body.length < 10) return { error: "Add a little more detail so we can help." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .maybeSingle();

  const priority = String(formData.get("priority") ?? "normal");

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      subject,
      body,
      priority: ["low", "normal", "high", "urgent"].includes(priority) ? priority : "normal",
      opened_by: user.id,
      organization_id: profile?.organization_id ?? null,
      project_id: (formData.get("projectId") as string) || null,
    })
    // The reference is assigned by trigger, so it has to be read back rather
    // than guessed — and reading it back needs the select policy to allow it.
    .select("reference")
    .single();
  if (error) return { error: friendly(error.message, "open that ticket") };

  revalidatePath("/client/support");
  revalidatePath("/admin/support");
  return { ok: true, reference: data?.reference ?? undefined };
}

export async function replyToTicket(ticketId: string, formData: FormData): Promise<Result> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You are not signed in." };

  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { error: "Write a reply first." };

  const { error } = await supabase.from("support_ticket_replies").insert({
    ticket_id: ticketId,
    author_id: user.id,
    body,
    is_internal: formData.get("isInternal") === "on",
  });
  if (error) return { error: friendly(error.message, "post that reply") };

  revalidatePath("/client/support");
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function setTicketStatus(ticketId: string, status: TicketStatus): Promise<Result> {
  const supabase = await createClient();

  // resolved_at is not optional — a check constraint refuses a resolved ticket
  // without one, and refuses a stale one on a reopened ticket.
  const decided = status === "resolved" || status === "closed";
  const { error } = await supabase
    .from("support_tickets")
    .update({ status, resolved_at: decided ? new Date().toISOString() : null })
    .eq("id", ticketId);
  if (error) return { error: friendly(error.message, "update that ticket") };

  revalidatePath("/client/support");
  revalidatePath("/admin/support");
  return { ok: true };
}

export async function assignTicket(ticketId: string, assigneeId: string | null): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ assignee_id: assigneeId })
    .eq("id", ticketId);
  if (error) return { error: friendly(error.message, "assign that ticket") };

  revalidatePath("/admin/support");
  return { ok: true };
}
