-- =============================================================================
-- 0043_restore_policy_predicate_execute.sql
--
-- Repairs a lockout caused by 0042.
--
-- 0042 revoked EXECUTE across the private schema to close the hole 0041 opened.
-- It closed the hole and also broke signing in. PostgreSQL checks EXECUTE
-- against the CURRENT USER for functions called inside an RLS policy, so
-- revoking it from `authenticated` made every policy that calls
-- private.is_admin(), can_edit_content(), can_see_project() and friends fail.
--
-- The symptom pointed somewhere else entirely: the login screen reported
-- "Your account has no profile. Contact an administrator." The profile existed
-- and was correct — the policy that would have returned it could not run.
--
-- THE DISTINCTION 0042 MISSED: these helpers only ever answer questions ABOUT
-- THE CALLER. is_admin() tells you whether YOU are an admin; effective_level()
-- tells you YOUR grant; current_org_id() tells you YOUR organisation. Being
-- able to call them reveals nothing about anybody else, so EXECUTE on them is
-- safe to grant.
--
-- What stays revoked is anything that WRITES — write_audit (forgeable audit
-- entries), record_migration — and every trigger function, which is invoked by
-- the table owner and never needs caller EXECUTE.
--
-- Verified after applying: anon still cannot forge an audit entry or record a
-- migration, can still submit a lead, and signing in works again.
--
-- SAFE TO RE-RUN. Requires 0042.
-- =============================================================================

grant execute on function private.is_admin()            to anon, authenticated;
grant execute on function private.can_edit_content()    to anon, authenticated;
grant execute on function private.can_see_project(uuid) to anon, authenticated;
grant execute on function private.can_see_invoice(uuid) to anon, authenticated;
grant execute on function private.current_org_id()      to anon, authenticated;
grant execute on function private.current_portal()      to anon, authenticated;
grant execute on function private.current_role_id()     to anon, authenticated;
grant execute on function private.effective_level(text) to anon, authenticated;
grant execute on function private.slugify(text)         to anon, authenticated;

select private.record_migration('0043', 'restore_policy_predicate_execute');
