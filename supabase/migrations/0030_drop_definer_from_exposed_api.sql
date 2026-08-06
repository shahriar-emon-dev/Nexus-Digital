-- =============================================================================
-- 0030_drop_definer_from_exposed_api.sql
--
-- Removes SECURITY DEFINER from everything PostgREST publishes.
--
-- 0026 made three telemetry functions SECURITY DEFINER in `public` and argued
-- the in-body private.is_admin() guard made that safe. It did — but it was
-- also unnecessary, which is better. Probing what `authenticated` can actually
-- read settled it:
--
--     pg_stat_user_tables    OK        pg_stat_activity   OK
--     pg_statio_user_tables  OK        pg_database_size   OK
--     pg_stat_database       OK        pg_settings        OK
--     pg_stat_statements     DENIED
--
-- Only one of the seven catalogs needs elevation. So two functions become
-- SECURITY INVOKER outright, and the third keeps its privileged read in the
-- `private` schema — which PostgREST does not publish — behind a SECURITY
-- INVOKER wrapper that authorises the caller first. A definer function called
-- BY an invoker function still runs with its owner's rights, so the capability
-- survives while the exposed surface does not.
--
-- SAFE TO RE-RUN. Requires 0026_database_health_rpc.sql.
-- =============================================================================

-- ------------------------------------------------- database_health: invoker --

create or replace function public.database_health()
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $fn$
declare
  v_result jsonb;
begin
  if not private.is_admin() then
    raise exception 'not authorised' using errcode = 'insufficient_privilege';
  end if;

  select jsonb_build_object(
    'database_bytes',   pg_catalog.pg_database_size(pg_catalog.current_database()),
    'connections_used', (select count(*) from pg_catalog.pg_stat_activity
                          where datname = pg_catalog.current_database()),
    'connections_max',  (select setting::int from pg_catalog.pg_settings where name = 'max_connections'),
    'cache_hit_ratio',  (select case
                            when sum(heap_blks_hit) + sum(heap_blks_read) > 0
                              then round((sum(heap_blks_hit)::numeric
                                   / (sum(heap_blks_hit) + sum(heap_blks_read))) * 100, 1)
                            else null
                          end
                          from pg_catalog.pg_statio_user_tables),
    'commits',          (select xact_commit   from pg_catalog.pg_stat_database
                          where datname = pg_catalog.current_database()),
    'rollbacks',        (select xact_rollback from pg_catalog.pg_stat_database
                          where datname = pg_catalog.current_database()),
    'stats_since',      (select stats_reset   from pg_catalog.pg_stat_database
                          where datname = pg_catalog.current_database()),
    'deadlocks',        (select deadlocks     from pg_catalog.pg_stat_database
                          where datname = pg_catalog.current_database()),
    'tables',           (select count(*) from pg_catalog.pg_stat_user_tables),
    'live_rows',        (select coalesce(sum(n_live_tup), 0) from pg_catalog.pg_stat_user_tables),
    'dead_rows',        (select coalesce(sum(n_dead_tup), 0) from pg_catalog.pg_stat_user_tables)
  ) into v_result;

  return v_result;
end $fn$;

comment on function public.database_health() is
  'Live Postgres telemetry. SECURITY INVOKER: every catalog it reads is '
  'readable by authenticated without elevation, so running as the definer '
  'bought nothing and widened the blast radius.';

-- ------------------------------------------------ table_statistics: invoker --

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
security invoker
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
    pg_catalog.pg_total_relation_size(s.relid),
    s.seq_scan,
    coalesce(s.idx_scan, 0),
    greatest(s.last_vacuum, s.last_autovacuum),
    greatest(s.last_analyze, s.last_autoanalyze)
  from pg_catalog.pg_stat_user_tables s
  where s.schemaname = 'public'
  order by pg_catalog.pg_total_relation_size(s.relid) desc;
end $fn$;

comment on function public.table_statistics() is
  'Per-table size and scan counts. SECURITY INVOKER - pg_stat_user_tables '
  'needs no elevation.';

-- ------------------------------- slow_queries: privileged half goes private --

create or replace function private.read_slow_queries(p_limit int)
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
  -- pg_stat_statements is the one catalog `authenticated` cannot read: it
  -- requires pg_read_all_stats. This function therefore has to run as its
  -- owner - and it lives in `private` so PostgREST never publishes it. The
  -- caller is authorised by the public wrapper before this is reached.
  if not exists (select 1 from pg_catalog.pg_extension where extname = 'pg_stat_statements') then
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
security invoker
set search_path = ''
as $fn$
begin
  if not private.is_admin() then
    raise exception 'not authorised' using errcode = 'insufficient_privilege';
  end if;

  return query select * from private.read_slow_queries(p_limit);
end $fn$;

comment on function public.slow_queries(int) is
  'Slowest statements by mean execution time. SECURITY INVOKER wrapper that '
  'authorises the caller, then delegates the one privileged read to '
  'private.read_slow_queries.';

revoke all on function public.database_health()  from public, anon;
revoke all on function public.table_statistics() from public, anon;
revoke all on function public.slow_queries(int)  from public, anon;
revoke all on function private.read_slow_queries(int) from public, anon, authenticated;
grant execute on function public.database_health()  to authenticated;
grant execute on function public.table_statistics() to authenticated;
grant execute on function public.slow_queries(int)  to authenticated;

select private.record_migration('0030', 'drop_definer_from_exposed_api');
