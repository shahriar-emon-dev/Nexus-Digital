"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, RotateCcw, Send, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import { useRealtime } from "@/lib/supabase/use-realtime";
import { cancelEmail, requeueEmail, resolveOutbox } from "@/lib/supabase/email-actions";

export type PreparedEmail = {
  id: string;
  toEmail: string;
  toName: string | null;
  template: string;
  status: string;
  attempts: number;
  lastError: string | null;
  sendAfter: string;
  sentAt: string | null;
  createdAt: string;
  subject: string;
  body: string;
};

const statusTone: Record<string, "brand" | "success" | "danger" | "warning" | "default"> = {
  queued: "brand",
  sending: "warning",
  sent: "success",
  failed: "danger",
  cancelled: "default",
};

/**
 * The send-by-hand worklist.
 *
 * Built around copying rather than monitoring, because a human is the transport
 * here. Each row expands to the exact subject and body, with one button that
 * copies both in the shape a mail client expects and another that marks it
 * sent.
 *
 * "Mark sent" calls the same `resolveOutbox` a worker would call, so the row
 * lands in exactly the state automated delivery would leave it in. Nothing
 * about this screen has to be unpicked when a provider is added later.
 */
export function OutboxTable({ rows }: { rows: PreparedEmail[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  // Another admin working the same queue, or a trigger enqueueing a new
  // message, updates this list without a reload.
  useRealtime("admin:outbox", [{ table: "email_outbox" }], () => router.refresh());

  const when = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  async function copy(row: PreparedEmail) {
    const text = `To: ${row.toName ? `${row.toName} <${row.toEmail}>` : row.toEmail}\nSubject: ${row.subject}\n\n${row.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(row.id);
      // Reverts the affordance rather than leaving a permanent tick, which
      // would read as "this one is done".
      window.setTimeout(() => setCopied((c) => (c === row.id ? null : c)), 2000);
    } catch {
      toast.add({ title: "Could not access the clipboard", type: "error" });
    }
  }

  function markSent(id: string) {
    startTransition(async () => {
      const result = await resolveOutbox(id, true);
      if ("error" in result) {
        toast.add({ title: result.error, type: "error" });
        return;
      }
      toast.add({ title: "Marked sent", type: "success" });
      router.refresh();
    });
  }

  function requeue(id: string) {
    startTransition(async () => {
      await requeueEmail(id);
      router.refresh();
    });
  }

  function cancel(id: string) {
    startTransition(async () => {
      await cancelEmail(id);
      router.refresh();
    });
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const expanded = open === row.id;
        const scheduled = new Date(row.sendAfter).getTime() > Date.now();

        return (
          <li key={row.id}>
            <Card
              variant="glass"
              className={cn(
                "gap-3 rounded-xl p-4",
                row.status === "failed" && "border-danger-line"
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : row.id)}
                  aria-expanded={expanded}
                  className="min-w-0 flex-1 text-left focus-visible:outline-none"
                >
                  <p className="truncate font-medium text-ink">{row.subject}</p>
                  <p className="truncate text-sm text-ink-tertiary">
                    {row.toName ? `${row.toName} · ` : ""}
                    {row.toEmail} · {row.template}
                  </p>
                </button>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {scheduled && row.status === "queued" && (
                    <Badge variant="outline">
                      scheduled {when.format(new Date(row.sendAfter))}
                    </Badge>
                  )}
                  <Badge variant={statusTone[row.status] ?? "default"}>{row.status}</Badge>
                  {row.attempts > 0 && (
                    <span data-tabular className="text-xs text-ink-tertiary">
                      {row.attempts} attempt{row.attempts === 1 ? "" : "s"}
                    </span>
                  )}
                </div>
              </div>

              {row.lastError && (
                <p className="rounded-lg border border-danger-line bg-danger-subtle px-3 py-2 text-xs text-ink-secondary">
                  {row.lastError}
                </p>
              )}

              {expanded && (
                <>
                  <pre className="max-h-72 overflow-auto rounded-lg border border-line bg-surface-sunken p-4 text-xs leading-relaxed whitespace-pre-wrap text-ink-secondary">
                    {row.body}
                  </pre>

                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => copy(row)}>
                      {copied === row.id ? <Check /> : <Copy />}
                      {copied === row.id ? "Copied" : "Copy message"}
                    </Button>

                    {row.status !== "sent" && row.status !== "cancelled" && (
                      <Button size="sm" disabled={pending} onClick={() => markSent(row.id)}>
                        <Send />
                        Mark sent
                      </Button>
                    )}

                    {(row.status === "failed" || row.status === "cancelled") && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => requeue(row.id)}
                      >
                        <RotateCcw />
                        Put back in the queue
                      </Button>
                    )}

                    {row.status === "queued" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={pending}
                        onClick={() => cancel(row.id)}
                      >
                        <X />
                        Cancel
                      </Button>
                    )}
                  </div>
                </>
              )}
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
