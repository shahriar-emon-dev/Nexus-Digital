"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, Info, ScrollText, Search, ShieldAlert, TriangleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRealtime } from "@/lib/supabase/use-realtime";
import type { AuditEntry, AuditSeverity } from "@/lib/supabase/audit-queries";
import { cn } from "@/lib/utils";

const severityTone: Record<AuditSeverity, "default" | "info" | "warning" | "danger"> = {
  info: "default",
  notice: "info",
  warning: "warning",
  critical: "danger",
};

const severityIcon: Record<AuditSeverity, typeof Info> = {
  info: Info,
  notice: Info,
  warning: TriangleAlert,
  critical: ShieldAlert,
};

const timeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/**
 * Filters are URL state, so a filtered view is a link an auditor can send to
 * someone else. They round-trip to the server because filtering fifty rows
 * client-side would silently exclude everything on later pages.
 */
export function AuditTable({
  entries,
  total,
  hasMore,
  entityTypes,
  page,
}: {
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
  entityTypes: string[];
  page: number;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [search, setSearch] = React.useState(params.get("q") ?? "");
  const [expanded, setExpanded] = React.useState<number | null>(null);

  /** A privileged action taken anywhere lands here without a reload. */
  useRealtime("admin:audit", [{ table: "audit_log", event: "INSERT" }], () => router.refresh());

  const update = React.useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "" || v === "all") next.delete(k);
        else next.set(k, v);
      }
      // Any filter change invalidates the offset — page 3 of the old result
      // set is meaningless against the new one.
      if (!("page" in patch)) next.delete("page");
      router.push(`/admin/audit-logs?${next.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <form
          className="relative min-w-56 flex-1"
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: search });
          }}
        >
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-tertiary"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search summary, actor or action…"
            aria-label="Search the audit trail"
            className="pl-9"
          />
        </form>

        <Select
          value={params.get("severity") ?? "all"}
          onValueChange={(v) => update({ severity: v as string })}
        >
          <SelectTrigger className="w-40" aria-label="Filter by severity">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any severity</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="notice">Notice</SelectItem>
            <SelectItem value="info">Info</SelectItem>
          </SelectContent>
        </Select>

        {entityTypes.length > 0 && (
          <Select
            value={params.get("entity") ?? "all"}
            onValueChange={(v) => update({ entity: v as string })}
          >
            <SelectTrigger className="w-44" aria-label="Filter by entity">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any entity</SelectItem>
              {entityTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={params.get("days") ?? "30"} onValueChange={(v) => update({ days: v as string })}>
          <SelectTrigger className="w-36" aria-label="Time range">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {entries.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={total === 0 ? "Nothing recorded yet" : "No matches"}
          description={
            total === 0
              ? "Privileged actions — role changes, portal reassignments, credential rotations — are written here by database triggers, so nothing can act without leaving a record."
              : "No entry matches those filters in this window."
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="min-w-0 p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[56rem] border-collapse text-left">
                <caption className="sr-only">
                  Audit trail entries, newest first. Each row is immutable.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">When</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Actor</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Action</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Detail</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {entries.map((e) => {
                    const Icon = severityIcon[e.severity];
                    const hasMeta = Object.keys(e.metadata as object).length > 0;
                    const open = expanded === e.id;
                    return (
                      <React.Fragment key={e.id}>
                        <tr
                          className={cn(
                            "transition-colors hover:bg-surface-sunken/40",
                            hasMeta && "cursor-pointer"
                          )}
                          onClick={() => hasMeta && setExpanded(open ? null : e.id)}
                        >
                          <th scope="row" className="px-5 py-3 text-left font-normal">
                            <span
                              data-tabular
                              className="font-mono text-xs whitespace-nowrap text-ink-secondary"
                            >
                              {timeFmt.format(new Date(e.created_at))}
                            </span>
                          </th>

                          <td className="px-3 py-3">
                            {/* Denormalised at write time, so this still names
                                the actor after the account is deleted. */}
                            <span className="block text-sm text-ink">
                              {e.actor_name || e.actor_email || "System"}
                            </span>
                            {e.actor_name && e.actor_email && (
                              <span className="block text-xs text-ink-tertiary">{e.actor_email}</span>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            <code className="rounded-md bg-surface-sunken px-2 py-0.5 font-mono text-xs text-ink-secondary">
                              {e.action}
                            </code>
                          </td>

                          <td className="px-3 py-3 text-sm text-ink-secondary">{e.summary}</td>

                          <td className="px-3 py-3 text-right">
                            <Badge variant={severityTone[e.severity]} size="sm">
                              <Icon aria-hidden />
                              {e.severity}
                            </Badge>
                          </td>
                        </tr>
                        {open && hasMeta && (
                          <tr className="bg-surface-sunken/40">
                            <td colSpan={5} className="px-5 py-3">
                              <pre className="overflow-x-auto font-mono text-xs text-ink-tertiary">
                                {JSON.stringify(e.metadata, null, 2)}
                              </pre>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-tertiary" aria-live="polite">
          {entries.length === 0
            ? "No entries"
            : `Showing ${entries.length} of ${total} in this window`}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => update({ page: String(page - 1) })}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasMore}
            onClick={() => update({ page: String(page + 1) })}
          >
            Next
          </Button>
        </div>
      </div>

      <p className="flex items-start gap-2 text-xs text-ink-tertiary">
        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
        Entries cannot be edited or deleted by anyone, including the service
        role — the table refuses UPDATE, DELETE and TRUNCATE at the database.
      </p>
    </div>
  );
}
