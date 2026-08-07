-- =============================================================================
-- 0053_fix_reject_audit_insert_search_path.sql
--
-- 0048 added private.reject_audit_insert without pinning search_path, which the
-- linter flagged. The function only raises, so it was never exploitable — but
-- an unpinned search_path on a trigger function is exactly the pattern worth
-- refusing to let become a habit.
--
-- SAFE TO RE-RUN. Requires 0048.
-- =============================================================================

create or replace function private.reject_audit_insert()
returns trigger language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_log accepts writes only through private.write_audit'
    using errcode = 'insufficient_privilege';
end $$;

select private.record_migration('0053', 'fix_reject_audit_insert_search_path');
