import Link from "next/link";
import { ScrollText } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import { listAuditEntries, type AuditEntry } from "@/lib/supabase/audit-queries";

/**
 * The most recent privileged actions, read from the audit trail.
 *
 * Previously four hardcoded lines that never changed — including a $24,500
 * Stripe payment for a contract that does not exist and a blocked login from
 * an RFC1918 address. A dashboard that invents security events is worse than
 * one with an empty panel, because it teaches people to ignore the panel.
 *
 * Severity is carried by the tag text as well as its colour, so a line reads
 * the same in greyscale, in a print-out, and under any colour-vision
 * deficiency.
 */

const severityStyle: Record<AuditEntry["severity"], { text: string; row: string; tag: string }> = {
  info: { text: "text-ion", row: "", tag: "INFO" },
  notice: { text: "text-success", row: "", tag: "NOTE" },
  warning: { text: "text-warning", row: "border-l-2 border-warning/40 bg-warning/5", tag: "WARN" },
  critical: { text: "text-danger", row: "border-l-2 border-danger/40 bg-danger/5", tag: "CRIT" },
};

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

export async function CommandLogs() {
  const { entries } = await listAuditEntries({ limit: 6 });

  return (
    <section aria-labelledby="command-logs-heading">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 id="command-logs-heading" className="font-heading text-xl font-semibold text-ink">
          Live Command Logs
        </h3>
        <Button variant="link" size="sm" render={<Link href="/admin/audit-logs" />}>
          View Full Archive
        </Button>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No privileged actions recorded"
          description="Role changes, portal reassignments and credential rotations are written here by database triggers as they happen."
        />
      ) : (
        <ol className="flex flex-col gap-3 font-mono text-xs">
          {entries.map((entry) => {
            const style = severityStyle[entry.severity];
            return (
              <li
                key={entry.id}
                className={cn(
                  "group flex flex-wrap items-start gap-x-4 gap-y-1 rounded p-2",
                  "transition-colors duration-(--duration-instant) hover:bg-surface-sunken",
                  style.row
                )}
              >
                <time className="shrink-0 text-ink-tertiary" dateTime={entry.created_at}>
                  {timeFmt.format(new Date(entry.created_at))}
                </time>
                <span className={cn("shrink-0 font-bold", style.text)}>[{style.tag}]</span>
                <span className="min-w-40 flex-1 text-ink-secondary">{entry.summary}</span>
                <Link
                  href={`/admin/audit-logs?entity=${encodeURIComponent(entry.entity_type)}`}
                  className={cn(
                    "ml-auto shrink-0 rounded-sm tracking-wider uppercase transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                    entry.severity === "critical"
                      ? "font-bold text-danger hover:underline"
                      : "text-ink-tertiary hover:text-brand"
                  )}
                >
                  Details
                  <span className="sr-only"> for {entry.summary}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
