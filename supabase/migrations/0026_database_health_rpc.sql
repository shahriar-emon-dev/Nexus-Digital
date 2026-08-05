-- =============================================================================
-- 0026_database_health_rpc.sql
--
-- Real database telemetry, replacing invented figures.
--
-- The sidebar reported "System Load 24%" and "Redis 98% Healthy"; the Query
-- Intelligence screen reported 99.9% uptime, a 94.3% Redis hit rate, 1.2 GB of
-- 4 GB memory, 1,587 TPS and a 48 ms p99. There is no Redis in this stack and
-- nothing measured any of it. Postgres does expose real equivalents, and these
-- functions return those.
--
-- WHY THESE LIVE IN `public` WHEN EVERY OTHER SECURITY DEFINER LIVES IN
-- `private`: PostgREST only publishes functions in `public`, and these have to
-- be callable over the API. Each one therefore raises unless the caller passes
-- private.is_admin() — the guard is inside the function body, not the schema.
-- EXECUTE is also revoked from anon.
--
-- SAFE TO RE-RUN. Requires 0011_fix_admin_privilege_conflation.sql.
-- =============================================================================

create or replace function public.database_health()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception 'not authorised' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'database_bytes',   pg_database_size(current_database()),
    'connections_used', (select count(*) from pg_stat_activity
                          where datname = current_database()),
    'connections_max',  (select setting::int from pg_settings where name = 'max_connections'),
    -- The genuine equivalent of the invented "Redis hit rate": the share of
    -- block reads served from shared buffers rather than disk.
    'cache_hit_ratio',  (select case
                            when sum(heap_blks_hit) + sum(heap_blks_read) > 0
                              then round((sum(heap_blks_hit)::numeric
                                   / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 1)
                            else null
                          end
                          from pg_statio_user_tables),
    'commits',          (select xact_commit   from pg_stat_database
                          where datname = current_database()),
    'rollbacks',        (select xact_rollback from pg_stat_database
                          where datname = current_database()),
    'stats_since',      (select stats_reset   from pg_stat_database
                          where datname = current_database()),
    'deadlocks',        (select deadlocks     from pg_stat_database
                          where datname = current_database()),
    'tables',           (select count(*) from pg_stat_user_tables),
    'live_rows',        (select coalesce(sum(n_live_tup), 0) from pg_stat_user_tables),
    'dead_rows',        (select coalesce(sum(n_dead_tup), 0) from pg_stat_user_tables)
  ) into v_result;

  return v_result;
end $fn$;

comment on function public.database_health() is
  'Live Postgres telemetry for the admin database screen. Guarded by '
  'private.is_admin() inside the body, because PostgREST only publishes '
  'functions in the public schema.';

create or replace function public.table_statistics()
returns table (
  table_name    text,
  live_rows     bigint,
  dead_rows     bigint,
  total_bytes   bigint,
  seq_scans     bigint,
  index_scans   bigint,
  last_vacuum   timestamptz,
  last_analyze  timestamptz
)
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if not private.is_admin() then
    raise exception 'not authorised' using errcode = 'insufficient_privilege';
  end if;

  return query
  select
    s.relname::text,
    s.n_live_tup,
    s.n_dead_tup,
    pg_total_relation_size(s.relid),
    s.seq_scan,
    coalesce(s.idx_scan, 0),
    greatest(s.last_vacuum, s.last_autovacuum),
    greatest(s.last_analyze, s.last_autoanalyze)
  from pg_stat_user_tables s
  where s.schemaname = 'public'
  order by pg_total_relation_size(s.relid) desc;
end $fn$;

comment on function public.table_statistics() is
  'Per-table size and scan counts. Admin-guarded inside the body.';

create or replace function public.slow_queries(p_limit int default 10)
returns table (
  query        text,
  calls        bigint,
  total_ms     double precision,
  mean_ms      double precision,
  max_ms       double precision,
  rows_out     bigint
)
language plpgsql
security definer
set search_path = ''
as $fn$
begin
  if not private.is_admin() then
    raise exception 'not authorised' using errcode = 'insufficient_privilege';
  end if;

  -- pg_stat_statements is present on this project, but a deployment without
  -- it should degrade to an empty list rather than a 500.
  if not exists (select 1 from pg_extension where extname = 'pg_stat_statements') then
    return;
  end if;

  return query
  select
    left(s.query, 240),
    s.calls,
    s.total_exec_time,
    s.mean_exec_time,
    s.max_exec_time,
    s.rows
  from public.pg_stat_statements s
  where s.query not ilike '%pg_stat_statements%'
  order by s.mean_exec_time desc
  limit greatest(1, least(p_limit, 50));
end $fn$;

comment on function public.slow_queries(int) is
  'Slowest statements by mean execution time, measured by pg_stat_statements. '
  'Admin-guarded inside the body.';

revoke all on function public.database_health()      from public, anon;
revoke all on function public.table_statistics()     from public, anon;
revoke all on function public.slow_queries(int)      from public, anon;
grant execute on function public.database_health()   to authenticated;
grant execute on function public.table_statistics()  to authenticated;
grant execute on function public.slow_queries(int)   to authenticated;

select private.record_migration('0026', 'database_health_rpc');
