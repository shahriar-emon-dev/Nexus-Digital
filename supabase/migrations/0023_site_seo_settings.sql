-- =============================================================================
-- 0023_site_seo_settings.sql
--
-- Global SEO and marketing tags, moved out of a hardcoded module.
--
-- site_settings is already a single-row table (its primary key is a boolean
-- pinned true), so these are columns rather than a second table. The previous
-- source also shipped an `ogImage` pointing at a design-tool CDN URL that
-- expires; the value is now editable, so it can be replaced without a deploy.
--
-- SAFE TO RE-RUN. Requires 0015_navigation_and_site_settings.sql.
-- =============================================================================

alter table public.site_settings
  add column if not exists ga4_measurement_id  text,
  add column if not exists gtm_container_id    text,
  add column if not exists default_title       text,
  add column if not exists meta_description    text,
  add column if not exists og_image_url        text,
  add column if not exists og_image_alt        text,
  -- Injected scripts are an XSS vector by definition. They are gated behind
  -- the same admin write policy as everything else on this row, and are the
  -- reason this table has no anon write path at all.
  add column if not exists header_scripts      text,
  add column if not exists body_start_scripts  text;

comment on column public.site_settings.header_scripts is
  'Raw markup injected into <head> on every public page. Admin-writable only.';

update public.site_settings set
  default_title = coalesce(default_title,
    'Nexus Digital Agency | Engineering-led brand and commerce'),
  meta_description = coalesce(meta_description,
    'We design and build the digital systems behind ambitious brands - commerce, content and measurement, engineered end to end.')
where id;

select private.record_migration('0023', 'site_seo_settings');
