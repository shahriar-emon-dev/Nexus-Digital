-- =============================================================================
-- 0044_fix_slow_queries_schema.sql
--
-- Makes the Slowest Statements panel actually return rows.
--
-- 0041 fixed one reason slow_queries was empty (no EXECUTE on the private
-- delegate). Testing it afterwards — rather than assuming the grant was the
-- whole story — surfaced a second, independent bug that had been there since
-- 0030: the function read `public.pg_stat_statements`, and Supabase installs
-- that extension into the `extensions` schema. The relation never existed under
-- the name the query used.
--
-- Two bugs, one symptom, and the caller maps any error to an empty array — so
-- fixing the first changed nothing visible, and would have read as "still
-- broken, cause unknown" if the panel had not been checked for ROWS rather than
-- for a heading.
--
-- Verified after applying: as `authenticated`, 10 rows, slowest 741.06ms.
--
-- SAFE TO RE-RUN. Requires 0030 and 0041.
-- =============================================================================

create or replace function private.read_slow_queries(p_limit integer)
returns table (
  query    text,
  calls    bigint,
  total_ms double precision,
  mean_ms  double precision,
  max_ms   double precision,
  rows_out bigint
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Checks the relation, not the extension name. `to_regclass` returns null
  -- rather than raising, so a deployment without the extension still degrades
  -- to an empty list instead of a 500.
  if to_regclass('extensions.pg_stat_statements') is null then
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
  from extensions.pg_stat_statements s
  -- The dashboard's own polling would otherwise dominate its own report.
  where s.query not ilike '%pg_stat_statements%'
  order by s.mean_exec_time desc
  limit greatest(1, least(p_limit, 50));
end $$;

revoke all on function private.read_slow_queries(integer) from public, anon;
grant execute on function private.read_slow_queries(integer) to authenticated;

select private.record_migration('0044', 'fix_slow_queries_schema');
