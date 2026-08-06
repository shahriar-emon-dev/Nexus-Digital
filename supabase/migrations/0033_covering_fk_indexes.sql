-- =============================================================================
-- 0033_covering_fk_indexes.sql
--
-- Covering indexes for the remaining foreign keys.
--
-- These matter when the PARENT row changes, not when the child is queried:
-- deleting a profile makes Postgres scan every referencing table to enforce
-- the constraint, and without an index that is a sequential scan per table.
-- Deleting a user is exactly the operation this project performs from the
-- admin console, so it is worth the write cost.
--
-- Note the tension with the `unused_index` lint: an index added for
-- referential integrity reads as unused until something actually deletes a
-- parent row. That is expected, and not a reason to remove them. Chasing both
-- lints to zero simultaneously is not possible, and integrity wins.
--
-- SAFE TO RE-RUN.
-- =============================================================================

create index if not exists invoice_payments_recorder_idx on public.invoice_payments (recorded_by);
create index if not exists invoices_creator_idx          on public.invoices (created_by);
create index if not exists page_versions_creator_idx     on public.page_versions (created_by);
create index if not exists pages_creator_idx             on public.pages (created_by);
create index if not exists pages_updater_idx             on public.pages (updated_by);
create index if not exists site_settings_homepage_idx    on public.site_settings (homepage_page_id);
create index if not exists site_settings_updater_idx     on public.site_settings (updated_by);

select private.record_migration('0033', 'covering_fk_indexes');
