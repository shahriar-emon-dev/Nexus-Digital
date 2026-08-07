-- =============================================================================
-- 0057_seed_packages_from_services.sql
--
-- One pricing package per published service, derived from the catalogue rather
-- than retyped.
--
-- /pricing used to render its own hardcoded array with its own titles, prices,
-- categories and commercial models, so it and /services could describe two
-- different businesses. Seeding from service_details means the two agree on day
-- one and diverge only when an editor deliberately changes one.
--
-- Only published services with a real price and lead time. A package with no
-- price renders "On request", which is a legitimate editorial choice — just not
-- one to create by accident.
--
-- SAFE TO RE-RUN: conflicts on slug are skipped, so an edited package is never
-- overwritten by the seed.
-- =============================================================================

insert into public.pricing_packages
  (name, slug, blurb, price_amount, currency, price_period, model, category,
   features, service_page_id, is_published, display_order)
select
  p.title,
  replace(p.slug, 'services/', ''),
  sd.summary,
  sd.price_from,
  'USD',
  'project',
  'Project',
  sd.category,
  jsonb_build_array(
    'Typical delivery ' || sd.lead_time_weeks || ' weeks',
    'Fixed scope agreed up front',
    'Handover documentation included'
  ),
  p.id,
  true,
  coalesce(sd.display_order, 0)
from public.pages p
join public.service_details sd on sd.page_id = p.id
where p.page_type = 'service'
  and p.status = 'published'
  and p.published_version_id is not null
  and sd.price_from is not null
  and sd.lead_time_weeks is not null
on conflict (slug) do nothing;

select private.record_migration('0057', 'seed_packages_from_services');
