-- =============================================================================
-- 0047_temporary_grants_covering_indexes.sql
--
-- Closes the last two unindexed-foreign-key findings.
--
-- 0033 added a covering index for every foreign key that existed at the time.
-- public.temporary_grants was created afterwards, in 0035, and reintroduced the
-- same gap on two of its own keys — which is the ordinary way this lint comes
-- back: it is not a one-off cleanup, it is a property each new table has to be
-- given.
--
-- Without these, deleting a profile or a capability module has to sequentially
-- scan temporary_grants to check for referencing rows.
--
-- SAFE TO RE-RUN. Requires 0035.
-- =============================================================================

create index if not exists temporary_grants_granted_by_idx
  on public.temporary_grants (granted_by);

create index if not exists temporary_grants_module_idx
  on public.temporary_grants (module_id);

select private.record_migration('0047', 'temporary_grants_covering_indexes');
