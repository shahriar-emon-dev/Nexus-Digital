-- =============================================================================
-- 0042_lock_down_private_execute.sql
--
-- Closes a hole opened by 0041.
--
-- 0041 granted USAGE on schema private so the invoker wrappers could reach
-- their delegates. USAGE alone looked harmless, but EXECUTE on a function
-- defaults to PUBLIC — so granting USAGE made EVERY private function callable
-- by anon, including private.write_audit. A probe confirmed it: as anon,
--
--     perform private.write_audit('probe','probe',null,'forged');   -- ALLOWED
--
-- A forged entry in the append-only audit trail is about the worst thing on
-- that list. PostgREST only publishes `public`, so it was not reachable over
-- the API today — but it was exactly the kind of latent grant that becomes
-- reachable the moment somebody adds a public wrapper.
--
-- Fixed by revoking EXECUTE from PUBLIC across the schema and re-granting only
-- the two delegates the wrappers need.
--
-- NOTE: this file on its own locks authenticated users OUT — see 0043. RLS
-- policy predicates call private.is_admin() and friends, and PostgreSQL checks
-- EXECUTE for those against the CURRENT USER.
--
-- SAFE TO RE-RUN. Requires 0041.
-- =============================================================================

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

-- Only these two are reached through a public wrapper.
grant execute on function private.create_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated;
grant execute on function private.read_slow_queries(int)
  to authenticated;

-- Default privileges for anything created here later: no EXECUTE to PUBLIC, so
-- a future private function is locked down the moment it exists rather than
-- depending on someone remembering this file.
alter default privileges in schema private revoke execute on functions from public;

select private.record_migration('0042', 'lock_down_private_execute');
