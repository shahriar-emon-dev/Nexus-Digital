import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";

/**
 * Infrastructure telemetry — only what is genuinely measured.
 *
 * The screens this feeds previously asserted 99.9% uptime, a 94.3% Redis hit
 * rate, 1.2 GB of 4 GB memory, 1,587 TPS and a 48 ms p99 latency. There is no
 * Redis in this stack, and nothing anywhere measured any of those numbers.
 *
 * Postgres exposes real equivalents, and this module returns those and only
 * those. Where no measurement exists — edge traffic, WAF rules, a compute
 * fleet — the answer is `null` and the screen says so, because a plausible
 * number is worse than an empty one: it gets acted on.
 */

export type DatabaseHealth = {
  databaseBytes: number;
  connectionsUsed: number;
  connectionsMax: number;
  /** Share of block reads served from shared buffers. Null before any read. */
  cacheHitRatio: number | null;
  commits: number;
  rollbacks: number;
  statsSince: string | null;
  deadlocks: number;
  tables: number;
  liveRows: number;
  deadRows: number;
};

export type TableStat = {
  tableName: string;
  liveRows: number;
  deadRows: number;
  totalBytes: number;
  seqScans: number;
  indexScans: number;
  lastVacuum: string | null;
  lastAnalyze: string | null;
};

export type SlowQuery = {
  query: string;
  calls: number;
  totalMs: number;
  meanMs: number;
  maxMs: number;
  rowsOut: number;
};

/**
 * Returns null rather than throwing when the caller is not an admin.
 *
 * The RPC raises `insufficient_privilege` by design; a screen behind the same
 * grant should render an explanation rather than a 500 page if the two ever
 * disagree.
 */
export async function getDatabaseHealth(): Promise<DatabaseHealth | null> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("database_health");
  if (error || !data) return null;

  const d = data as Record<string, unknown>;
  return {
    databaseBytes: Number(d.database_bytes ?? 0),
    connectionsUsed: Number(d.connections_used ?? 0),
    connectionsMax: Number(d.connections_max ?? 0),
    cacheHitRatio: d.cache_hit_ratio === null ? null : Number(d.cache_hit_ratio),
    commits: Number(d.commits ?? 0),
    rollbacks: Number(d.rollbacks ?? 0),
    statsSince: (d.stats_since as string) ?? null,
    deadlocks: Number(d.deadlocks ?? 0),
    tables: Number(d.tables ?? 0),
    liveRows: Number(d.live_rows ?? 0),
    deadRows: Number(d.dead_rows ?? 0),
  };
}

export async function getTableStatistics(): Promise<TableStat[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("table_statistics");
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    tableName: String(r.table_name),
    liveRows: Number(r.live_rows ?? 0),
    deadRows: Number(r.dead_rows ?? 0),
    totalBytes: Number(r.total_bytes ?? 0),
    seqScans: Number(r.seq_scans ?? 0),
    indexScans: Number(r.index_scans ?? 0),
    lastVacuum: (r.last_vacuum as string) ?? null,
    lastAnalyze: (r.last_analyze as string) ?? null,
  }));
}

export async function getSlowQueries(limit = 10): Promise<SlowQuery[]> {
  noStore();
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("slow_queries", { p_limit: limit });
  if (error || !data) return [];

  return (data as Record<string, unknown>[]).map((r) => ({
    query: String(r.query ?? ""),
    calls: Number(r.calls ?? 0),
    totalMs: Number(r.total_ms ?? 0),
    meanMs: Number(r.mean_ms ?? 0),
    maxMs: Number(r.max_ms ?? 0),
    rowsOut: Number(r.rows_out ?? 0),
  }));
}

/** Connection pressure and cache health, for the sidebar badges. */
export async function getSidebarTelemetry(): Promise<{
  connectionPct: number | null;
  cacheHitRatio: number | null;
} | null> {
  const health = await getDatabaseHealth();
  if (!health) return null;

  return {
    connectionPct:
      health.connectionsMax > 0
        ? Math.round((health.connectionsUsed / health.connectionsMax) * 100)
        : null,
    cacheHitRatio: health.cacheHitRatio,
  };
}

export const formatBytes = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1_048_576
      ? `${(n / 1024).toFixed(0)} KB`
      : n < 1_073_741_824
        ? `${(n / 1_048_576).toFixed(1)} MB`
        : `${(n / 1_073_741_824).toFixed(2)} GB`;
