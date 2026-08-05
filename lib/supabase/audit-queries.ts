import { unstable_noStore as noStore } from "next/cache";

import { createClient } from "./server";
import type { Database } from "./types";

/**
 * The audit trail.
 *
 * Read-only by construction: there is no update or delete here because the
 * table refuses both, for every role including the service role. Rows are
 * written by triggers on the privileged tables rather than by call sites, so
 * a change made in the SQL editor is recorded exactly like one made through
 * the UI — an audit trail that depends on every caller remembering to write
 * to it is an audit trail with holes in it.
 */

export type AuditEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type AuditSeverity = AuditEntry["severity"];

export type AuditFilter = {
  severity?: AuditSeverity;
  entityType?: string;
  actorId?: string;
  /** ISO date; entries on or after this instant. */
  since?: string;
  search?: string;
  limit?: number;
  offset?: number;
};

export type AuditPage = {
  entries: AuditEntry[];
  total: number;
  hasMore: boolean;
};

const PAGE = 50;

export async function listAuditEntries(filter: AuditFilter = {}): Promise<AuditPage> {
  noStore();
  const supabase = await createClient();

  const limit = filter.limit ?? PAGE;
  const offset = filter.offset ?? 0;

  let q = supabase
    .from("audit_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter.severity) q = q.eq("severity", filter.severity);
  if (filter.entityType) q = q.eq("entity_type", filter.entityType);
  if (filter.actorId) q = q.eq("actor_id", filter.actorId);
  if (filter.since) q = q.gte("created_at", filter.since);
  if (filter.search) {
    const term = `%${filter.search.replace(/[%_]/g, "")}%`;
    q = q.or(`summary.ilike.${term},actor_email.ilike.${term},action.ilike.${term}`);
  }

  const { data, count } = await q;
  const entries = (data ?? []) as AuditEntry[];

  return {
    entries,
    total: count ?? entries.length,
    hasMore: offset + entries.length < (count ?? 0),
  };
}

/** History for one entity — the per-key trail on the credential drawer. */
export async function listAuditFor(
  entityType: string,
  entityId: string,
  limit = 20
): Promise<AuditEntry[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .eq("entity_type", entityType)
    .eq("entity_id", entityId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as AuditEntry[];
}

export type AuditSummary = {
  total: number;
  last24h: number;
  critical: number;
  warnings: number;
  /** Distinct actors in the window, not a guess at "active admins". */
  actors: number;
};

/**
 * Counts for the header tiles, each from its own count query.
 *
 * Deliberately not derived from a page of rows: a tile that says "3 critical"
 * because that is all the first fifty entries contained is worse than no tile.
 */
export async function auditSummary(sinceDays = 30): Promise<AuditSummary> {
  noStore();
  const supabase = await createClient();
  const since = new Date(Date.now() - sinceDays * 86_400_000).toISOString();
  const day = new Date(Date.now() - 86_400_000).toISOString();

  const [total, recent, critical, warnings, actorRows] = await Promise.all([
    supabase.from("audit_log").select("id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("audit_log").select("id", { count: "exact", head: true }).gte("created_at", day),
    supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("severity", "critical")
      .gte("created_at", since),
    supabase
      .from("audit_log")
      .select("id", { count: "exact", head: true })
      .eq("severity", "warning")
      .gte("created_at", since),
    supabase.from("audit_log").select("actor_id").gte("created_at", since),
  ]);

  return {
    total: total.count ?? 0,
    last24h: recent.count ?? 0,
    critical: critical.count ?? 0,
    warnings: warnings.count ?? 0,
    actors: new Set((actorRows.data ?? []).map((r) => r.actor_id).filter(Boolean)).size,
  };
}

/** Entity types actually present, so the filter never offers an empty option. */
export async function auditEntityTypes(): Promise<string[]> {
  noStore();
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("entity_type").limit(1000);
  return [...new Set((data ?? []).map((r) => r.entity_type as string))].sort();
}
