"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus, TicketCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import { ticketStatusTone } from "@/lib/portal-tones";
import { useRealtime } from "@/lib/supabase/use-realtime";
import {
  openTicket,
  replyToTicket,
  setTicketStatus,
  type Ticket,
  type TicketReply,
  type TicketStatus,
} from "@/lib/supabase/support-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/**
 * Shared by the client and staff support screens.
 *
 * `canManage` decides whether the status controls and the internal-note toggle
 * appear. It is a UI affordance only — the policies refuse a client's attempt
 * to change status or post an internal note regardless of what is rendered, so
 * this cannot become the security boundary by accident.
 */
export function TicketWorkspace({
  tickets,
  activeTicketId,
  replies,
  canManage,
}: {
  tickets: Ticket[];
  activeTicketId: string | null;
  replies: TicketReply[];
  canManage: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [composing, setComposing] = React.useState(tickets.length === 0);
  const newFormRef = React.useRef<HTMLFormElement>(null);
  const replyFormRef = React.useRef<HTMLFormElement>(null);

  useRealtime(
    "support:tickets",
    [{ table: "support_tickets" }, { table: "support_ticket_replies" }],
    () => router.refresh()
  );

  const active = tickets.find((t) => t.id === activeTicketId) ?? tickets[0] ?? null;

  function onOpen(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await openTicket(form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      newFormRef.current?.reset();
      setComposing(false);
      router.refresh();
    });
  }

  function onReply(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!active) return;
    const form = new FormData(event.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = await replyToTicket(active.id, form);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      replyFormRef.current?.reset();
      router.refresh();
    });
  }

  function onStatus(status: TicketStatus) {
    if (!active) return;
    startTransition(async () => {
      const result = await setTicketStatus(active.id, status);
      if ("error" in result) setError(result.error);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      {/* ── Ticket list ───────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <Button
          className="rounded-xl"
          onClick={() => setComposing((v) => !v)}
          variant={composing ? "outline" : "default"}
        >
          <MessageSquarePlus />
          {composing ? "Cancel" : "New request"}
        </Button>

        {tickets.length === 0 && !composing && (
          <p className="rounded-2xl border border-line bg-surface p-6 text-center text-[0.875rem] text-ink-tertiary">
            No tickets yet.
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {tickets.map((ticket) => (
            <li key={ticket.id}>
              <button
                type="button"
                onClick={() => router.push(`?ticket=${ticket.id}`)}
                aria-current={ticket.id === active?.id ? "true" : undefined}
                className={cn(
                  "flex w-full flex-col gap-1 rounded-xl border p-3 text-left transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  ticket.id === active?.id
                    ? "border-brand/40 bg-brand/5"
                    : "border-line bg-surface hover:bg-surface-sunken"
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[0.875rem] font-medium text-ink">
                    {ticket.subject}
                  </span>
                  <Badge variant={ticketStatusTone[ticket.status]} size="sm">
                    {ticket.status}
                  </Badge>
                </span>
                <span className="text-[0.75rem] text-ink-tertiary">
                  {ticket.reference} · {ticket.replyCount}{" "}
                  {ticket.replyCount === 1 ? "reply" : "replies"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Detail ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4">
        {error && (
          <p role="alert" className="text-[0.875rem] text-danger">
            {error}
          </p>
        )}

        {composing && (
          <Card variant="glass" className="gap-4 rounded-2xl p-6">
            <h2 className="font-heading text-xl font-semibold text-ink">Open a request</h2>
            <form ref={newFormRef} onSubmit={onOpen} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="subject" className="text-[0.8125rem] font-medium text-ink">
                  Subject
                </label>
                <Input id="subject" name="subject" required minLength={3} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="priority" className="text-[0.8125rem] font-medium text-ink">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  defaultValue="normal"
                  className="h-11 rounded-lg border border-line bg-surface px-3 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="body" className="text-[0.8125rem] font-medium text-ink">
                  What do you need?
                </label>
                <textarea
                  id="body"
                  name="body"
                  rows={5}
                  required
                  minLength={10}
                  className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
                />
              </div>

              <Button type="submit" className="w-fit rounded-xl" disabled={pending}>
                {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                Submit request
              </Button>
            </form>
          </Card>
        )}

        {active && !composing && (
          <Card variant="glass" className="gap-5 rounded-2xl p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-heading text-xl font-semibold text-ink">{active.subject}</h2>
                <p className="mt-1 text-[0.8125rem] text-ink-tertiary">
                  {active.reference} · opened by {active.openedByName ?? "someone"} ·{" "}
                  {active.priority} priority
                  {active.assigneeName && ` · assigned to ${active.assigneeName}`}
                </p>
              </div>
              <Badge variant={ticketStatusTone[active.status]}>{active.status}</Badge>
            </div>

            <p className="rounded-xl bg-surface-sunken p-4 text-[0.9375rem] whitespace-pre-wrap text-ink-secondary">
              {active.body}
            </p>

            <ul className="flex flex-col gap-3">
              {replies.map((reply) => (
                <li
                  key={reply.id}
                  className={cn(
                    "rounded-xl border p-3",
                    reply.is_internal
                      ? "border-warning-line bg-warning-subtle"
                      : "border-line bg-surface"
                  )}
                >
                  <p className="mb-1 flex items-center gap-2 text-[0.8125rem]">
                    <span className="font-semibold text-ink">{reply.authorName}</span>
                    {reply.is_internal && (
                      <Badge variant="warning" size="sm">
                        Internal
                      </Badge>
                    )}
                    <time
                      dateTime={reply.created_at}
                      className="text-ink-tertiary"
                      suppressHydrationWarning
                    >
                      {new Date(reply.created_at).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </time>
                  </p>
                  <p className="text-[0.9375rem] whitespace-pre-wrap text-ink-secondary">
                    {reply.body}
                  </p>
                </li>
              ))}
            </ul>

            <form ref={replyFormRef} onSubmit={onReply} className="flex flex-col gap-3">
              <label htmlFor="reply-body" className="sr-only">
                Reply
              </label>
              <textarea
                id="reply-body"
                name="body"
                rows={3}
                required
                placeholder="Write a reply…"
                className="resize-y rounded-lg border border-line bg-surface px-3 py-2.5 text-[0.9375rem] text-ink focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none"
              />

              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" className="rounded-xl" disabled={pending}>
                  {pending && <Loader2 className="animate-spin motion-reduce:animate-none" />}
                  Reply
                </Button>

                {canManage && (
                  <label className="flex items-center gap-2 text-[0.8125rem] text-ink-secondary">
                    <input type="checkbox" name="isInternal" className="size-4 accent-[var(--brand)]" />
                    Internal note — the client never sees this
                  </label>
                )}
              </div>
            </form>

            {canManage && (
              <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
                <span className="text-[0.8125rem] text-ink-tertiary">Set status:</span>
                {(["open", "pending", "resolved", "closed"] as TicketStatus[]).map((status) => (
                  <Button
                    key={status}
                    variant={active.status === status ? "default" : "outline"}
                    size="sm"
                    className="rounded-lg capitalize"
                    disabled={pending || active.status === status}
                    onClick={() => onStatus(status)}
                  >
                    {status === "resolved" && <TicketCheck />}
                    {status}
                  </Button>
                ))}
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
