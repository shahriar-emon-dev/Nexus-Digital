-- =============================================================================
-- 0054_wrap_auth_uid_in_policies.sql
--
-- Postgres re-evaluates a call like auth.uid() once per row inside an RLS
-- predicate. Wrapping it in a scalar subquery lets the planner hoist it into an
-- InitPlan and evaluate it once per statement instead. On a messages table this
-- is the difference between one call and one call per message returned.
--
-- Written as a sweep rather than by hand: 0049–0051 spread these predicates
-- across three files and dozens of policies, and hand-editing invites missing
-- one. The sweep is idempotent — an already-wrapped policy is skipped.
--
-- Verified after applying: zero unwrapped occurrences remain, and no table
-- gained a duplicate permissive policy for the same role and command.
--
-- SAFE TO RE-RUN. Requires 0051.
-- =============================================================================

do $$
declare
  p       record;
  v_cmd   text;
  v_roles text;
  v_qual  text;
  v_check text;
  v_sql   text;
begin
  for p in
    select c.relname as tbl, pol.polname, pol.polcmd, pol.polroles,
           pg_get_expr(pol.polqual, pol.polrelid)      as qual,
           pg_get_expr(pol.polwithcheck, pol.polrelid) as wcheck
      from pg_policy pol
      join pg_class c     on c.oid = pol.polrelid
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and (pg_get_expr(pol.polqual, pol.polrelid)      like '%auth.uid()%'
         or pg_get_expr(pol.polwithcheck, pol.polrelid) like '%auth.uid()%')
       and (coalesce(pg_get_expr(pol.polqual, pol.polrelid), '')
         || coalesce(pg_get_expr(pol.polwithcheck, pol.polrelid), '')) not like '%( SELECT auth.uid()%'
  loop
    v_cmd := case p.polcmd
               when 'r' then 'select' when 'a' then 'insert'
               when 'w' then 'update' when 'd' then 'delete' else 'all' end;

    select string_agg(quote_ident(rolname), ', ') into v_roles
      from pg_roles where oid = any(p.polroles);
    v_roles := coalesce(v_roles, 'public');

    v_qual  := replace(p.qual,   'auth.uid()', '(select auth.uid())');
    v_check := replace(p.wcheck, 'auth.uid()', '(select auth.uid())');

    execute format('drop policy if exists %I on public.%I', p.polname, p.tbl);

    v_sql := format('create policy %I on public.%I for %s to %s', p.polname, p.tbl, v_cmd, v_roles);
    if v_qual  is not null then v_sql := v_sql || format(' using (%s)', v_qual); end if;
    if v_check is not null then v_sql := v_sql || format(' with check (%s)', v_check); end if;
    execute v_sql;
  end loop;
end $$;

select private.record_migration('0054', 'wrap_auth_uid_in_policies');
