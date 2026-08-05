-- =============================================================================
-- 0029_audit_actor_no_fk.sql
--
-- Drops the foreign key from audit_log.actor_id to profiles.
--
-- FOUND BY DELETING A TEST ACCOUNT. The column was declared
-- `references public.profiles (id) on delete set null`, so removing a user
-- made Postgres issue an UPDATE against audit_log — which the append-only
-- trigger correctly refused:
--
--     ERROR: audit_log is append-only: UPDATE is not permitted
--     CONTEXT: SQL statement "UPDATE ONLY public.audit_log SET actor_id = NULL"
--
-- The effect: once anyone appeared in the audit trail, their account could
-- never be deleted, and the error message blamed the audit log rather than the
-- constraint that actually caused it.
--
-- The foreign key was never earning its keep. actor_email and actor_name are
-- denormalised onto every row precisely so the trail still names the actor
-- after the account is gone — referential integrity to a row this table
-- expects to outlive is the opposite of what it wants.
--
-- This is the same class of defect as 0013, where an immutability trigger
-- blocked an FK cascade. A guard that refuses writes and a constraint that
-- performs writes on your behalf will always eventually meet.
--
-- SAFE TO RE-RUN. Requires 0022_reviews_credentials_audit.sql.
-- =============================================================================

alter table public.audit_log drop constraint if exists audit_log_actor_id_fkey;

comment on column public.audit_log.actor_id is
  'The acting profile id at the time of the action. Deliberately NOT a foreign '
  'key: the row must survive the account being deleted, and a cascade or SET '
  'NULL would be an UPDATE the append-only trigger refuses.';

select private.record_migration('0029', 'audit_actor_no_fk');
