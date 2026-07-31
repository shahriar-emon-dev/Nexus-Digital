/**
 * Database and cache telemetry behind the admin infrastructure screen.
 *
 * Shaped for the eventual `DbSample` / `SlowQuery` / `SystemEvent` tables.
 * Percentages, peaks and counts are all derived from the series below rather
 * than stored beside them — the source design printed "5 High-Impact Detected"
 * above a table it had no relationship to, and drew latency bars that were
 * fixed CSS heights.
 */

export type ServiceStatus = "Healthy" | "Optimized" | "Degraded" | "Down";

export const serviceStatusTone: Record<
  ServiceStatus,
  "success" | "brand" | "warning" | "danger"
> = {
  Healthy: "success",
  Optimized: "brand",
  Degraded: "warning",
  Down: "danger",
};

// ── Time series ─────────────────────────────────────────────────────────────

export type ThroughputSample = {
  /** Minutes before now, so nothing bakes a wall-clock time into the build. */
  minutesAgo: number;
  /** Transactions per second. */
  tps: number;
  /** P99 latency in milliseconds. */
  latencyMs: number;
  cacheHits: number;
  cacheMisses: number;
};

/** Six hours at ten-minute resolution. Deterministic, not random. */
export const samples: ThroughputSample[] = (() => {
  const out: ThroughputSample[] = [];
  const count = 36;
  for (let i = 0; i < count; i += 1) {
    const minutesAgo = (count - 1 - i) * 10;
    const wave = Math.sin((i / count) * Math.PI * 3);
    const ramp = i / (count - 1);

    const tps = Math.round(1_180 + wave * 260 + ramp * 340);
    // Latency falls as the window progresses — the card claims "improving".
    const latencyMs = Math.round(78 - ramp * 36 + Math.abs(wave) * 22);
    const total = Math.round(9_400 + wave * 900 + ramp * 1_500);
    const hitRate = 0.93 + ramp * 0.022 + wave * 0.006;
    const cacheHits = Math.round(total * hitRate);

    out.push({
      minutesAgo,
      tps,
      latencyMs,
      cacheHits,
      cacheMisses: total - cacheHits,
    });
  }
  return out;
})();

const latencies = samples.map((s) => s.latencyMs);
const totalHits = samples.reduce((s, x) => s + x.cacheHits, 0);
const totalMisses = samples.reduce((s, x) => s + x.cacheMisses, 0);

/** Middle value of the series. A real sample, not an interpolated one. */
function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

/**
 * `latencyMs` on each sample is already the P99 the database reported for that
 * interval, so these summarise a series of P99s rather than re-percentiling it.
 * Taking the 99th percentile of 36 readings would just return the maximum, and
 * the card would print the same number twice under two different labels.
 */
export const latencyStats = {
  /** Most recent reading — what the headline figure shows. */
  current: latencies[latencies.length - 1],
  typical: median(latencies),
  peak: Math.max(...latencies),
  /** First half against second half, so "improving" is a measured claim. */
  trend: (() => {
    const half = Math.floor(latencies.length / 2);
    const before = latencies.slice(0, half).reduce((a, b) => a + b, 0) / half;
    const after =
      latencies.slice(half).reduce((a, b) => a + b, 0) / (latencies.length - half);
    return { before, after, improving: after < before };
  })(),
};

export const cacheStats = {
  hits: totalHits,
  misses: totalMisses,
  hitRate: (totalHits / (totalHits + totalMisses)) * 100,
};

export const throughputStats = {
  current: samples[samples.length - 1].tps,
  peak: Math.max(...samples.map((s) => s.tps)),
  average: Math.round(samples.reduce((s, x) => s + x.tps, 0) / samples.length),
};

// ── Services ────────────────────────────────────────────────────────────────

export type ServiceHealth = {
  id: string;
  name: string;
  kind: "postgres" | "redis" | "latency";
  status: ServiceStatus;
  uptimePct: number;
  connections?: { open: number; max: number };
  memory?: { usedMb: number; totalMb: number };
  evictions?: number;
};

export const services: ServiceHealth[] = [
  {
    id: "postgres",
    name: "PostgreSQL instance",
    kind: "postgres",
    status: "Healthy",
    uptimePct: 99.9,
    connections: { open: 142, max: 500 },
  },
  {
    id: "redis",
    name: "Redis cache",
    kind: "redis",
    status: "Optimized",
    uptimePct: 99.99,
    memory: { usedMb: 1_228, totalMb: 4_096 },
    evictions: 0,
  },
];

export const serviceById = (id: string) => services.find((s) => s.id === id);

/** Load is the share of the connection pool in use, not a separate number. */
export const connectionLoadPct = (service: ServiceHealth) =>
  service.connections
    ? Math.round((service.connections.open / service.connections.max) * 100)
    : 0;

export const memoryPct = (service: ServiceHealth) =>
  service.memory ? Math.round((service.memory.usedMb / service.memory.totalMb) * 100) : 0;

// ── Slow queries ────────────────────────────────────────────────────────────

export type SlowQuery = {
  id: string;
  hash: string;
  /** The statement, redacted of literals the way pg_stat_statements reports it. */
  statement: string;
  execMs: number;
  rowsScanned: number;
  callsPerMin: number;
  table: string;
  suggestion: string;
};

/** Anything at or above this is flagged as high impact. */
export const HIGH_IMPACT_MS = 500;

export const slowQueries: SlowQuery[] = [
  {
    id: "q1",
    hash: "0x7F2A9C",
    statement:
      "SELECT * FROM transactions WHERE client_id = $1 AND created_at > $2 ORDER BY created_at DESC",
    execMs: 1_420,
    rowsScanned: 1_200_000,
    callsPerMin: 42,
    table: "transactions",
    suggestion: "Composite index on (client_id, created_at DESC).",
  },
  {
    id: "q2",
    hash: "0xA1B23F",
    statement:
      "SELECT p.*, COUNT(m.id) FROM projects p LEFT JOIN milestones m ON m.project_id = p.id GROUP BY p.id",
    execMs: 890,
    rowsScanned: 800_000,
    callsPerMin: 156,
    table: "milestones",
    suggestion: "Index on milestones.project_id; the join is a sequential scan.",
  },
  {
    id: "q3",
    hash: "0x9C8B11",
    statement:
      "SELECT * FROM audit_logs WHERE actor_id = $1 AND action ILIKE $2",
    execMs: 640,
    rowsScanned: 450_000,
    callsPerMin: 312,
    table: "audit_logs",
    suggestion: "Trigram index on action, or replace ILIKE with an equality filter.",
  },
  {
    id: "q4",
    hash: "0x3E2D4A",
    statement: "SELECT * FROM invoices WHERE status != 'Paid' ORDER BY due_on ASC",
    execMs: 520,
    rowsScanned: 120_000,
    callsPerMin: 89,
    table: "invoices",
    suggestion: "Partial index on due_on WHERE status <> 'Paid'.",
  },
  {
    id: "q5",
    hash: "0xF5E48B",
    statement: "SELECT COUNT(*) FROM messages WHERE channel_id = $1 AND read_at IS NULL",
    execMs: 410,
    rowsScanned: 50_000,
    callsPerMin: 1_240,
    table: "messages",
    suggestion: "Partial index on channel_id WHERE read_at IS NULL.",
  },
  {
    id: "q6",
    hash: "0x2B71D0",
    statement: "SELECT * FROM keywords WHERE property_id = $1 ORDER BY position ASC",
    execMs: 180,
    rowsScanned: 12_000,
    callsPerMin: 24,
    table: "keywords",
    suggestion: "Already indexed; included for comparison.",
  },
];

/** Derived. The design hardcoded "5 High-Impact Detected". */
export const highImpactQueries = slowQueries.filter((q) => q.execMs >= HIGH_IMPACT_MS);

/** Time actually burned per minute — the honest way to rank these. */
export const queryLoadPerMin = (query: SlowQuery) =>
  (query.execMs * query.callsPerMin) / 1_000;

export const queriesByLoad = [...slowQueries].sort(
  (a, b) => queryLoadPerMin(b) - queryLoadPerMin(a)
);

// ── System events ───────────────────────────────────────────────────────────

export type SystemEvent = {
  id: string;
  title: string;
  detail: string;
  kind: "success" | "running" | "scheduled";
  /** Running events only. */
  progress?: number;
  when: string;
};

export const systemEvents: SystemEvent[] = [
  {
    id: "e1",
    title: "Index rebuild",
    detail: "Global 'users' table optimised. Freed 400 MB.",
    kind: "success",
    when: "2 minutes ago",
  },
  {
    id: "e2",
    title: "Daily statistics aggregator",
    detail: "Processing batch analytics for financial reporting.",
    kind: "running",
    progress: 65,
    when: "Started 8 minutes ago",
  },
  {
    id: "e3",
    title: "Auto-vacuum schedule",
    detail: "Scheduled maintenance for the 'audit_logs' partition.",
    kind: "scheduled",
    when: "Next run in 4 hours",
  },
  {
    id: "e4",
    title: "Schema migration 2026-07",
    detail: "Applied multi-tenant schema updates across 12 clusters.",
    kind: "success",
    when: "14 hours ago",
  },
];

export const runningEvents = systemEvents.filter((e) => e.kind === "running");

/**
 * The advisory shown in the footer strip. Tied to a real query so the claim can
 * be checked rather than asserted.
 */
export const topRecommendation = {
  queryId: "q1",
  /** Estimated P99 reduction, as a percentage. */
  estimatedGainPct: 14,
};
