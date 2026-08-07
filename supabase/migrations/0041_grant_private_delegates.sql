-- =============================================================================
-- 0041_grant_private_delegates.sql
--
-- Lets the SECURITY INVOKER wrappers actually reach their private delegates.
--
-- 0030 and 0040 both used the pattern "public INVOKER wrapper delegates to a
-- private DEFINER function". An invoker function resolves the inner call with
-- the CALLER's privileges, and neither anon nor authenticated has USAGE on the
-- private schema — so both wrappers failed with
--
--     42501: permission denied for schema private
--
-- submit_lead failed loudly enough to notice. slow_queries did not: its caller
-- maps any error to an empty array, so the Slowest Statements panel has been
-- quietly empty since 0030 and the browser test only asserted that the heading
-- rendered. A test that checks a heading rather than a row is exactly how a
-- silent failure survives.
--
-- READ 0042 AND 0043 BEFORE COPYING THIS FILE. Granting USAGE here was not
-- sufficient and not safe on its own: EXECUTE on a function defaults to PUBLIC,
-- so this grant briefly made every private function callable by anon. 0042
-- closes that; 0043 repairs the over-correction.
--
-- SAFE TO RE-RUN. Requires 0030 and 0040.
-- =============================================================================

grant usage on schema private to anon, authenticated;

grant execute on function private.create_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated;
grant execute on function private.read_slow_queries(int)
  to authenticated;

select private.record_migration('0041', 'grant_private_delegates');
