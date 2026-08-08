-- =============================================================================
-- 0060_scope_site_settings_anon_reads.sql
--
-- SEC-05 from the second-pass audit.
--
-- site_settings was anon-readable with USING (true). Almost everything in the
-- row is injected into the public page anyway — the GA4 and GTM ids, the header
-- and body scripts, the OG image, the meta description — so exposure was
-- near-zero. The exception is `updated_by`, which discloses the UUID of the
-- administrator who last changed settings. Nothing else on the public surface
-- leaks a staff identifier, and this one did so for no benefit.
--
-- RLS is row-level: a policy can hide a row but not a column. A view can, so
-- anon reads the view and the table itself becomes authenticated-only.
--
-- security_invoker is deliberately OFF. The view's job is to widen access for
-- anon, which an invoker view could not do once the table's anon policy is
-- gone — it would run with the caller's rights and return nothing. Its safety
-- comes from the fixed column list below, not from the caller's permissions,
-- which is why that list must stay explicit and never become `select *`.
--
-- Verified after applying: anon reads 1 row through the view and 0 from the
-- table.
--
-- SAFE TO RE-RUN. Requires 0023 (site_settings).
-- =============================================================================

create or replace view public.public_site_settings
with (security_invoker = false) as
select
  id,
  homepage_page_id,
  site_name,
  default_title,
  meta_description,
  og_image_url,
  og_image_alt,
  ga4_measurement_id,
  gtm_container_id,
  header_scripts,
  body_start_scripts
from public.site_settings;

comment on view public.public_site_settings is
  'Site settings minus updated_by/updated_at. Definer rights on purpose: it is '
  'the only anon read path now that site_settings itself is authenticated-only.';

grant select on public.public_site_settings to anon, authenticated;

drop policy if exists site_settings_select on public.site_settings;
create policy site_settings_select on public.site_settings
  for select to authenticated
  using (true);

select private.record_migration('0060', 'scope_site_settings_anon_reads');
