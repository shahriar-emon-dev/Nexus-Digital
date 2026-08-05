import type { Metadata } from "next";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { StatCard } from "@/components/shared/StatCard";
import {
  auditEntityTypes,
  auditSummary,
  listAuditEntries,
  type AuditSeverity,
} from "@/lib/supabase/audit-queries";
import { AuditTable } from "./AuditTable";

export const metadata: Metadata = { title: "Audit Logs" };

const PAGE = 50;

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k][0] : sp[k]);

  const page = Math.max(1, Number(one("page") ?? 1) || 1);
  const days = one("days") ?? "30";
  const since =
    days === "all" ? undefined : new Date(Date.now() - Number(days) * 86_400_000).toISOString();

  const [result, summary, entityTypes] = await Promise.all([
    listAuditEntries({
      severity: (one("severity") as AuditSeverity) || undefined,
      entityType: one("entity") || undefined,
      search: one("q") || undefined,
      since,
      limit: PAGE,
      offset: (page - 1) * PAGE,
    }),
    // Counted over the same window the table is filtered to, so the tiles and
    // the rows are describing the same thing.
    auditSummary(days === "all" ? 3650 : Number(days)),
    auditEntityTypes(),
  ]);

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs items={[{ label: "Command Center", href: "/admin" }, { label: "Audit Logs" }]} />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Audit Logs
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Every privileged action, written by database triggers rather than by
          the application. A role change made in the SQL editor is recorded
          exactly like one made in this console.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Entries in window" value={summary.total.toLocaleString()} />
        <StatCard label="Last 24 hours" value={summary.last24h.toLocaleString()} />
        <StatCard
          label="Critical"
          value={summary.critical.toLocaleString()}
          caption={summary.critical === 0 ? "Nothing to review" : "Permission changes"}
        />
        <StatCard label="Distinct actors" value={summary.actors.toLocaleString()} />
      </div>

      <AuditTable
        entries={result.entries}
        total={result.total}
        hasMore={result.hasMore}
        entityTypes={entityTypes}
        page={page}
      />
    </div>
  );
}
