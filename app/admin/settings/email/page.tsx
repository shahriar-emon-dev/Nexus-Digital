import type { Metadata } from "next";
import { Mailbox } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { EmptyState } from "@/components/shared/EmptyState";
import { listOutbox, outboxSummary, renderEmail } from "@/lib/supabase/email-actions";
import { OutboxTable } from "./OutboxTable";

export const metadata: Metadata = {
  title: "Outbox",
  description: "Transactional email the platform has queued, ready to send.",
};

/**
 * The outbox worklist.
 *
 * No mail provider is connected, and the agency sends these by hand. That makes
 * this screen the actual delivery mechanism rather than a monitoring view, so
 * it is built for copying: every queued message is rendered to its final
 * subject and body up front, server side, and shown with a copy button and a
 * "mark sent" action.
 *
 * Rendering happens here rather than in the browser because `renderEmail` is
 * the same function a worker would call once a provider key exists. Sending by
 * hand today and automatically later must produce identical copy, or the
 * changeover silently rewords every message the agency has been sending.
 */
export default async function AdminEmailOutboxPage() {
  const [rows, summary] = await Promise.all([listOutbox(200), outboxSummary()]);

  // Pre-rendered on the server so the client component stays a dumb list.
  const prepared = await Promise.all(
    rows.map(async (row) => {
      const rendered = await renderEmail({
        template: row.template,
        payload: (row.payload as Record<string, unknown>) ?? {},
        to_name: row.to_name,
        subject: row.subject,
      });
      return {
        id: row.id,
        toEmail: row.to_email,
        toName: row.to_name,
        template: row.template,
        status: row.status,
        attempts: row.attempts,
        lastError: row.last_error,
        sendAfter: row.send_after,
        sentAt: row.sent_at,
        createdAt: row.created_at,
        subject: rendered.subject,
        body: rendered.text,
      };
    })
  );

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "Settings", href: "/admin/settings" },
          { label: "Outbox" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Outbox
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every message the platform has queued — enquiry acknowledgements,
          invoice notices and reminders, review requests. Copy one, send it from
          your own mail client, then mark it sent so it stops appearing here.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Count label="Queued" value={summary.queued} tone="brand" />
        <Count label="Sent" value={summary.sent} tone="success" />
        <Count label="Failed" value={summary.failed} tone="danger" />
        <Count label="Cancelled" value={summary.cancelled} tone="default" />
      </div>

      {summary.providerUnconfigured && (
        <Card variant="glass" className="gap-2 rounded-xl border-info-line p-4">
          <p className="text-sm text-ink-secondary">
            <span className="font-medium text-ink">Sending by hand.</span> No mail
            provider key is set, so nothing leaves the server automatically —
            which is why this screen exists. To automate later, set{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs">
              MAIL_PROVIDER_KEY
            </code>{" "}
            and run a worker over{" "}
            <code className="rounded bg-surface-sunken px-1.5 py-0.5 text-xs">
              claimOutbox → renderEmail → resolveOutbox
            </code>
            . The copy below is what that worker would send, unchanged.
          </p>
        </Card>
      )}

      {prepared.length === 0 ? (
        <EmptyState
          icon={Mailbox}
          title="Nothing queued"
          description="Messages are queued automatically when an enquiry arrives, an invoice changes status, or a project completes."
        />
      ) : (
        <OutboxTable rows={prepared} />
      )}
    </div>
  );
}

function Count({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "brand" | "success" | "danger" | "default";
}) {
  return (
    <Card variant="glass" className="min-w-32 flex-1 gap-1 rounded-xl p-4">
      <span className="text-xs tracking-wider text-ink-tertiary uppercase">{label}</span>
      <span className="flex items-baseline gap-2">
        <span data-tabular className="font-heading text-2xl font-bold text-ink">
          {value}
        </span>
        {value > 0 && tone !== "default" && <Badge variant={tone}>{tone === "danger" ? "needs attention" : ""}</Badge>}
      </span>
    </Card>
  );
}
