import Link from "next/link";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type LogKind = "AUTH" | "TRANS" | "SYNC" | "WARN";

export type LogEntry = {
  time: string;
  kind: LogKind;
  message: string;
  action?: string;
};

/**
 * Tag colours are paired with the tag text itself, so the severity of a line is
 * never carried by colour alone — the `[WARN]` token reads the same in
 * greyscale, in a print-out, and under any colour-vision deficiency.
 */
const kindStyle: Record<LogKind, { text: string; row: string }> = {
  AUTH: { text: "text-success", row: "" },
  TRANS: { text: "text-brand", row: "border-l-2 border-brand/40 bg-brand/5" },
  SYNC: { text: "text-ion", row: "" },
  WARN: { text: "text-danger", row: "border-l-2 border-danger/40 bg-danger/5" },
};

const entries: LogEntry[] = [
  {
    time: "14:22:04",
    kind: "AUTH",
    message: "Admin ALEX_VANCE successfully initialized System Audit protocol.",
  },
  {
    time: "13:45:12",
    kind: "TRANS",
    message: "Contract #8291 (Nova Fintech) payment of $24,500 processed via Stripe.",
  },
  {
    time: "12:05:58",
    kind: "SYNC",
    message: "Global Project Templates updated by Lead Architect ELARA_KENT.",
  },
  {
    time: "11:12:30",
    kind: "WARN",
    message: "Login anomaly detected from IP 192.168.1.104. Automated block applied.",
    action: "Investigate",
  },
];

export function CommandLogs() {
  return (
    <section aria-labelledby="command-logs-heading">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h3 id="command-logs-heading" className="font-heading text-xl font-semibold text-ink">
          Live Command Logs
        </h3>
        <Button variant="link" size="sm" render={<Link href="/admin/settings/security" />}>
          View Full Archive
        </Button>
      </div>

      <ol className="flex flex-col gap-3 font-mono text-xs">
        {entries.map((entry) => {
          const style = kindStyle[entry.kind];
          return (
            <li
              key={entry.time}
              className={cn(
                "group flex flex-wrap items-start gap-x-4 gap-y-1 rounded p-2",
                "transition-colors duration-(--duration-instant) hover:bg-surface-sunken",
                style.row
              )}
            >
              <time className="shrink-0 text-ink-tertiary" dateTime={entry.time}>
                {entry.time}
              </time>
              <span className={cn("shrink-0 font-bold", style.text)}>[{entry.kind}]</span>
              <span className="min-w-40 flex-1 text-ink-secondary">{entry.message}</span>
              <button
                type="button"
                className={cn(
                  "ml-auto shrink-0 rounded-sm tracking-wider uppercase transition-colors",
                  "focus-visible:ring-2 focus-visible:ring-brand/50 focus-visible:outline-none",
                  entry.action
                    ? "font-bold text-danger hover:underline"
                    : "text-ink-tertiary hover:text-brand"
                )}
              >
                {entry.action ?? "Details"}
                <span className="sr-only"> for the {entry.time} log entry</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
