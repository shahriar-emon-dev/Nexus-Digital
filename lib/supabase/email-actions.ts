"use server";

import { revalidatePath } from "next/cache";
import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * The transactional email outbox.
 *
 * Nothing here sends mail. Sending needs a provider API key that this project
 * does not have, and putting the call in a request path would mean a message is
 * lost whenever that provider is briefly unreachable. Migration 0062 created a
 * durable queue instead: triggers enqueue on lead creation, invoice status
 * change and project completion; a worker holding the key drains it.
 *
 * `renderEmail` below is the whole contract that worker needs. Templates live
 * here rather than in the database so a typo is fixed by a deploy rather than
 * by rewriting queued rows, and so the copy is reviewable in a diff.
 *
 * To go live: set MAIL_PROVIDER_KEY, then run a worker that loops
 *   claimOutbox() -> renderEmail(row) -> provider.send(...) -> resolveOutbox(...)
 * Everything except `provider.send` already exists and is tested by the types.
 */

export type OutboxRow = Database["public"]["Tables"]["email_outbox"]["Row"];
export type EmailStatus = Database["public"]["Enums"]["email_status"];

type Result = { ok: true } | { error: string };

export type OutboxSummary = {
  queued: number;
  sending: number;
  sent: number;
  failed: number;
  cancelled: number;
  /** True when no provider key is configured, so the queue cannot drain. */
  providerUnconfigured: boolean;
};

/* ------------------------------------------------------------ templates -- */

export type RenderedEmail = { subject: string; text: string };

const siteUrl = () => process.env.NEXT_PUBLIC_SITE_URL ?? "";

/**
 * Turns a queued row into sendable copy.
 *
 * Plain text only, deliberately. HTML email is its own discipline — inlined
 * CSS, table layouts, client quirks — and shipping a half-considered HTML
 * template is worse than clean text that renders identically everywhere. The
 * worker can wrap this in a branded HTML shell when somebody owns that work.
 */
export async function renderEmail(row: {
  template: string;
  payload: Record<string, unknown>;
  to_name?: string | null;
  subject: string;
}): Promise<RenderedEmail> {
  const p = row.payload ?? {};
  const name = (row.to_name as string) || "there";
  const base = siteUrl();

  switch (row.template) {
    case "lead_acknowledgement":
      return {
        subject: row.subject,
        text: [
          `Hi ${name},`,
          ``,
          `Thanks for getting in touch. We have your enquiry and someone will come back to you shortly.`,
          p.reference ? `Your reference is ${p.reference} — quote it if you need to chase.` : ``,
          ``,
          `— Nexus Digital Agency`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "invoice_sent":
      return {
        subject: row.subject,
        text: [
          `Hi ${name},`,
          ``,
          `Invoice ${p.number} is ready to view in your portal.`,
          p.dueDate ? `It is due on ${p.dueDate}.` : ``,
          base ? `${base}/client/invoices` : ``,
          ``,
          `— Nexus Digital Agency`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "invoice_due_soon":
      return {
        subject: row.subject,
        text: `Hi ${name},\n\nA reminder that invoice ${p.number} is due on ${p.dueDate}.\n${
          base ? `${base}/client/invoices` : ""
        }\n\n— Nexus Digital Agency`,
      };

    case "invoice_overdue":
      return {
        subject: row.subject,
        text: `Hi ${name},\n\nInvoice ${p.number} was due on ${p.dueDate} and is now overdue. If it has already been paid, please ignore this.\n${
          base ? `${base}/client/invoices` : ""
        }\n\n— Nexus Digital Agency`,
      };

    case "invoice_paid":
      return {
        subject: row.subject,
        text: `Hi ${name},\n\nWe have received your payment for invoice ${p.number}. Thank you.\n\n— Nexus Digital Agency`,
      };

    case "review_request":
      return {
        subject: row.subject,
        text: [
          `Hi ${name},`,
          ``,
          `${p.projectName} is complete. If you have two minutes, we would value your review — it helps other businesses decide whether we are a fit.`,
          base ? `${base}/client/reviews/new` : ``,
          ``,
          `— Nexus Digital Agency`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    case "client_welcome":
      return {
        subject: row.subject,
        text: [
          `Hi ${name},`,
          ``,
          `Your client portal is ready. You can follow project progress, read and send messages, view deliverables and settle invoices there.`,
          base ? `${base}/auth/login` : ``,
          ``,
          `— Nexus Digital Agency`,
        ]
          .filter(Boolean)
          .join("\n"),
      };

    default:
      // An unknown template must not silently send an empty message.
      return {
        subject: row.subject,
        text: `${row.subject}\n\n(No template is registered for "${row.template}".)`,
      };
  }
}

/* --------------------------------------------------------------- admin --- */

export async function listOutbox(limit = 100): Promise<OutboxRow[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_outbox")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as OutboxRow[];
}

export async function outboxSummary(): Promise<OutboxSummary> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.from("email_outbox").select("status");

  const rows = (data ?? []) as { status: EmailStatus }[];
  const count = (s: EmailStatus) => rows.filter((r) => r.status === s).length;

  return {
    queued: count("queued"),
    sending: count("sending"),
    sent: count("sent"),
    failed: count("failed"),
    cancelled: count("cancelled"),
    providerUnconfigured: !process.env.MAIL_PROVIDER_KEY,
  };
}

/** Claims a batch for a worker. Advances each row to `sending`. */
export async function claimOutbox(limit = 20): Promise<OutboxRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("claim_emails", { p_limit: limit });
  if (error) return [];
  return (data ?? []) as OutboxRow[];
}

/** Records the outcome. Failures are retried with backoff, six times, then parked. */
export async function resolveOutbox(
  id: string,
  ok: boolean,
  error?: string
): Promise<Result> {
  const supabase = await createClient();
  const { error: rpcError } = await supabase.rpc("resolve_email", {
    p_id: id,
    p_ok: ok,
    p_error: error ?? undefined,
  });
  if (rpcError) return { error: rpcError.message };

  revalidatePath("/admin/settings/email");
  return { ok: true };
}

/** Puts a parked message back in the queue after the cause has been fixed. */
export async function requeueEmail(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_outbox")
    .update({ status: "queued", attempts: 0, last_error: null, send_after: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings/email");
  return { ok: true };
}

export async function cancelEmail(id: string): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("email_outbox")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/settings/email");
  return { ok: true };
}
