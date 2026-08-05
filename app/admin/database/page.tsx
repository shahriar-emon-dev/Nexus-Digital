import type { Metadata } from "next";
import { Activity, Database, Gauge, HardDrive, Timer, TriangleAlert } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Progress } from "@/components/ui/progress";
import { StatCard } from "@/components/shared/StatCard";
import {
  formatBytes,
  getDatabaseHealth,
  getSlowQueries,
  getTableStatistics,
} from "@/lib/supabase/infrastructure-queries";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Query Intelligence" };

const num = new Intl.NumberFormat("en-US");
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/**
 * Query Intelligence, measured rather than asserted.
 *
 * The previous screen reported 99.9% uptime, a 94.3% Redis hit rate, 1.2 GB of
 * 4 GB memory, 1,587 TPS and a 48 ms p99 — over a stack with no Redis and no
 * instrumentation. Every figure below comes from `pg_stat_*`, which Postgres
 * maintains whether or not anyone is looking.
 */
export default async function AdminDatabasePage() {
  const [health, tables, slow] = await Promise.all([
    getDatabaseHealth(),
    getTableStatistics(),
    getSlowQueries(12),
  ]);

  if (!health) {
    return (
      <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
        <Breadcrumbs
          items={[{ label: "Command Center", href: "/admin" }, { label: "Query Intelligence" }]}
        />
        {/* The RPC raises rather than returning empty, so this is a genuine
            authorisation refusal — not an empty database. */}
        <EmptyState
          icon={Database}
          title="Database telemetry is restricted"
          description="Reading PostgreSQL statistics requires an admin grant on Security Policies. Ask a Global Admin to adjust it under Access Control."
        />
      </div>
    );
  }

  const connectionPct =
    health.connectionsMax > 0
      ? Math.round((health.connectionsUsed / health.connectionsMax) * 100)
      : null;
  const rollbackPct =
    health.commits + health.rollbacks > 0
      ? (health.rollbacks / (health.commits + health.rollbacks)) * 100
      : null;
  const bloatPct =
    health.liveRows + health.deadRows > 0
      ? Math.round((health.deadRows / (health.liveRows + health.deadRows)) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-8 px-5 py-10 lg:px-10">
      <Breadcrumbs
        items={[
          { label: "Command Center", href: "/admin" },
          { label: "System Security", href: "/admin/database" },
          { label: "Query Intelligence" },
        ]}
      />

      <header>
        <h1 className="font-heading text-[2.5rem] leading-[1.15] font-bold tracking-tight text-ink">
          Query Intelligence
        </h1>
        <p className="mt-2 max-w-2xl text-ink-tertiary">
          Live PostgreSQL statistics. Counters accumulate from{" "}
          {health.statsSince ? dateFmt.format(new Date(health.statsSince)) : "the last reset"}, so
          totals are since then rather than all time — and there is no cache
          layer in this stack, so none is reported.
        </p>
      </header>

      {health.deadlocks > 0 && (
        <Alert tone="warning">
          <AlertDescription>
            {health.deadlocks} deadlock{health.deadlocks === 1 ? "" : "s"} recorded since the
            counters were reset. Deadlocks are rare enough that any non-zero
            count is worth reading the query list below for.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Database size"
          value={formatBytes(health.databaseBytes)}
          caption={`${num.format(health.tables)} tables · ${num.format(health.liveRows)} rows`}
          icon={HardDrive}
        />
        <StatCard
          label="Connections"
          value={`${health.connectionsUsed} / ${health.connectionsMax}`}
          caption={connectionPct === null ? undefined : `${connectionPct}% of the pool`}
          icon={Activity}
        />
        <StatCard
          label="Buffer cache hits"
          value={health.cacheHitRatio === null ? "—" : `${health.cacheHitRatio}%`}
          caption={
            health.cacheHitRatio === null
              ? "No reads recorded yet"
              : "Reads served from shared buffers"
          }
          icon={Gauge}
        />
        <StatCard
          label="Transactions"
          value={num.format(health.commits)}
          caption={
            rollbackPct === null
              ? "No transactions yet"
              : `${rollbackPct.toFixed(2)}% rolled back`
          }
          icon={Database}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ------------------------------------------------ connection pool -- */}
        <Card>
          <CardHeader>
            <CardTitle>Connection pool</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress
              value={connectionPct ?? 0}
              className={cn("h-2", (connectionPct ?? 0) > 80 && "[&>*]:bg-warning")}
            />
            <p className="text-sm text-ink-secondary">
              {health.connectionsUsed} of {health.connectionsMax} connections in use.
              {(connectionPct ?? 0) > 80 &&
                " Above 80% is where pooling problems start to show as timeouts rather than errors."}
            </p>
          </CardContent>
        </Card>

        {/* --------------------------------------------------------- bloat -- */}
        <Card>
          <CardHeader>
            <CardTitle>Dead tuples</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Progress
              value={bloatPct}
              className={cn("h-2", bloatPct > 20 && "[&>*]:bg-warning")}
            />
            <p className="text-sm text-ink-secondary">
              {num.format(health.deadRows)} dead of{" "}
              {num.format(health.liveRows + health.deadRows)} total rows ({bloatPct}%).
              {bloatPct > 20
                ? " Autovacuum is falling behind on at least one table."
                : " Autovacuum is keeping pace."}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* --------------------------------------------------- slow queries -- */}
      <section aria-labelledby="slow-heading">
        <h2 id="slow-heading" className="mb-4 font-heading text-xl font-semibold text-ink">
          Slowest statements
        </h2>

        {slow.length === 0 ? (
          <EmptyState
            icon={Timer}
            title="No statement statistics yet"
            description="pg_stat_statements records queries as they run. An empty list means nothing has executed since the counters were reset, not that everything is fast."
          />
        ) : (
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto">
                <table className="w-full min-w-[54rem] border-collapse text-left">
                  <caption className="sr-only">
                    Statements ordered by mean execution time.
                  </caption>
                  <thead>
                    <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                      <th scope="col" className="px-5 py-3 font-semibold">Statement</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Calls</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Mean</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Max</th>
                      <th scope="col" className="px-3 py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-subtle">
                    {slow.map((q, i) => (
                      <tr key={i} className="align-top transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="max-w-xl px-5 py-3 text-left font-normal">
                          <code className="block truncate font-mono text-xs text-ink-secondary">
                            {q.query}
                          </code>
                        </th>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {num.format(q.calls)}
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm">
                          <span className={q.meanMs > 100 ? "font-semibold text-warning" : "text-ink"}>
                            {q.meanMs.toFixed(1)} ms
                          </span>
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {q.maxMs.toFixed(1)} ms
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {(q.totalMs / 1000).toFixed(2)} s
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      {/* ---------------------------------------------------------- tables -- */}
      <section aria-labelledby="tables-heading">
        <h2 id="tables-heading" className="mb-4 font-heading text-xl font-semibold text-ink">
          Tables
        </h2>

        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto">
              <table className="w-full min-w-[52rem] border-collapse text-left">
                <caption className="sr-only">
                  Public tables by size, with scan counts and last maintenance.
                </caption>
                <thead>
                  <tr className="border-b border-line-subtle bg-surface-sunken/60 text-[0.6875rem] tracking-[0.08em] text-ink-tertiary uppercase">
                    <th scope="col" className="px-5 py-3 font-semibold">Table</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Rows</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Size</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Seq scans</th>
                    <th scope="col" className="px-3 py-3 text-right font-semibold">Index scans</th>
                    <th scope="col" className="px-3 py-3 font-semibold">Last analyze</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line-subtle">
                  {tables.map((t) => {
                    // A table read only by sequential scan, once it has real
                    // volume, is the classic missing-index signature.
                    const scanRisk = t.liveRows > 500 && t.indexScans === 0 && t.seqScans > 10;
                    return (
                      <tr key={t.tableName} className="transition-colors hover:bg-surface-sunken/40">
                        <th scope="row" className="px-5 py-3 text-left font-normal">
                          <span className="flex items-center gap-2">
                            <code className="font-mono text-sm text-ink">{t.tableName}</code>
                            {scanRisk && (
                              <Badge variant="warning" size="sm">
                                <TriangleAlert aria-hidden />
                                No index use
                              </Badge>
                            )}
                          </span>
                        </th>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {num.format(t.liveRows)}
                          {t.deadRows > 0 && (
                            <span className="text-ink-tertiary"> +{num.format(t.deadRows)} dead</span>
                          )}
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {formatBytes(t.totalBytes)}
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {num.format(t.seqScans)}
                        </td>
                        <td data-tabular className="px-3 py-3 text-right text-sm text-ink-secondary">
                          {num.format(t.indexScans)}
                        </td>
                        <td className="px-3 py-3 text-sm text-ink-tertiary">
                          {t.lastAnalyze ? dateFmt.format(new Date(t.lastAnalyze)) : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
