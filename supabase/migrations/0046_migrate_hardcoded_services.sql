-- =============================================================================
-- 0046_migrate_hardcoded_services.sql
--
-- Moves the eight hardcoded services into the CMS.
--
-- lib/services.ts and app/(public)/services/[slug]/service-data.ts had been the
-- real source for /services/<slug> since before the CMS existed. The route
-- preferred a published CMS page and fell back to those files, which meant a
-- service could only be changed by a developer, and the admin catalogue and the
-- public site could describe two different businesses.
--
-- STATUS IS PRESERVED, NOT FLATTENED. Five were Published, two Draft
-- (ai-machine-learning, cybersecurity) and one Archived (mobile-apps).
-- Publishing the drafts would put unfinished service lines on the public site;
-- republishing the archived one would resurrect a service the agency retired.
-- Only the five published pages get a published_version_id, and the route reads
-- that pointer rather than `status`, so the other three 404 for visitors while
-- staying fully editable in the admin.
--
-- The long-form copy is deliberately NOT carried across. It was invented proof
-- — testimonials attributed to named people who do not exist, case study
-- results nobody measured, "99.9% Uptime", and two design-tool CDN image URLs
-- that will expire. Migrating it would have laundered fabricated marketing
-- claims into the database and made them look authored.
--
-- SAFE TO RE-RUN: a slug that already has a page is skipped, so this never
-- clobbers something an editor has since written.
-- =============================================================================

do $$
declare
  s record;
  v_page_id uuid;
  v_version_id uuid;
  v_status public.page_status;
begin
  for s in
    select * from (values
      ('web-development',     'Next.js Development',   'Engineering',    'published', 12000, 8,
       'High-performance, architecturally sound Next.js applications built for scale, speed and search.'),
      ('ux-ui-design',        'UX & UI Design',        'Design',         'published',  9500, 6,
       'Interface systems, motion language and design tokens that scale across every owned surface.'),
      ('cloud-systems',       'Cloud Systems',         'Infrastructure', 'published', 15000, 10,
       'Edge-first deployment, observability and cost control on AWS and Vercel.'),
      ('data-analytics',      'Data & Analytics',      'Growth',         'published', 11000, 7,
       'First-party measurement, warehouse-native attribution and board-ready reporting.'),
      ('brand-positioning',   'Brand Positioning',     'Strategy',       'published',  8000, 5,
       'Territory mapping, narrative and the identity system that carries it.'),
      ('ai-machine-learning', 'AI & Machine Learning', 'Engineering',    'draft',     18000, 12,
       'Applied models for search, personalisation and content operations - evaluated before they ship.'),
      ('cybersecurity',       'Cybersecurity',         'Infrastructure', 'draft',     14000, 9,
       'Threat modelling, dependency auditing and incident runbooks for product teams.'),
      ('mobile-apps',         'Mobile Applications',   'Engineering',    'archived',  16000, 14,
       'Retired in favour of progressive web delivery under Next.js Development.')
    ) as t(slug, name, category, status, price, weeks, summary)
  loop
    v_status := s.status::public.page_status;

    -- Never clobber a page an editor has already created at this slug.
    select id into v_page_id from public.pages where slug = 'services/' || s.slug;
    if v_page_id is not null then
      continue;
    end if;

    insert into public.pages (title, slug, status, page_type)
    values (s.name, 'services/' || s.slug, v_status, 'service')
    returning id into v_page_id;

    insert into public.page_versions (page_id, version_number, blocks, seo, is_draft)
    values (
      v_page_id, 1,
      jsonb_build_array(
        jsonb_build_object(
          'id', 'hero', 'kind', 'hero', 'variant', 'Default', 'visible', true,
          'data', jsonb_build_object(
            'eyebrow', upper(s.category),
            'heading', s.name,
            'body', s.summary,
            'ctaLabel', 'Book a discovery call',
            'ctaHref', '/contact')),
        jsonb_build_object(
          'id', 'cta', 'kind', 'cta', 'variant', 'Default', 'visible', true,
          'data', jsonb_build_object(
            'heading', 'Ready to start?',
            'body', 'Typical delivery is ' || s.weeks || ' weeks, from $' || s.price || '.',
            'ctaLabel', 'Talk to us',
            'ctaHref', '/contact'))
      ),
      jsonb_build_object('title', s.name, 'description', s.summary),
      false
    )
    returning id into v_version_id;

    -- Status alone does not publish; the pointer does.
    if v_status = 'published' then
      update public.pages set published_version_id = v_version_id where id = v_page_id;
    end if;

    insert into public.service_details (page_id, category, price_from, lead_time_weeks, summary)
    values (v_page_id, s.category, s.price, s.weeks, s.summary)
    on conflict (page_id) do nothing;
  end loop;
end $$;

select private.record_migration('0046', 'migrate_hardcoded_services');
