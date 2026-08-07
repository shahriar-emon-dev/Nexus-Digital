-- =============================================================================
-- 0059_seed_blog_posts_into_cms.sql
--
-- Moves the editorial posts out of lib/posts.ts into the CMS.
--
-- THREE THINGS ARE DELIBERATELY NOT CARRIED ACROSS:
--
--   * The per-post "metrics" chips — "Engagement 94.2%" attached to an article
--     — which were figures nothing measured.
--   * The cover images, which were design-tool CDN URLs that will expire.
--   * A post titled "Deconstructing the Astra Banking Architecture", claiming
--     "99.999% uptime" for a client that exists nowhere in this database.
--
-- The case studies from lib/case-studies.ts are not seeded at all, for the same
-- reason: four fictional clients with invented results ("420% Throughput
-- Increase"). A case study is a claim about work actually done, and the honest
-- source is a real project with case_study_page_id set. /case-studies renders a
-- proper empty state until one exists.
--
-- SAFE TO RE-RUN: a slug that already has a page is skipped.
-- =============================================================================

do $$
declare
  r record; v_page uuid; v_ver uuid;
begin
  for r in
    select * from (values
      ('future-of-predictive-ui', 'The Future of Predictive UI: Beyond Component-Based Design', 'How generative interfaces are reshaping the user journey through real-time architectural adaptation and autonomous visual decision-making.', 'AI & Automation', 7, '2026-06-18', true),
      ('architecture-of-scalable-edge-computing', 'The Architecture of Scalable Edge Computing', 'How we leveraged Next.js middleware and globally distributed edge functions to achieve sub-50ms latency for our high-traffic fintech partners.', 'Engineering', 12, '2026-05-24', false),
      ('scaling-nextjs-for-1m-users', 'Scaling Next.js for 1M+ Concurrent Users', 'Optimizing infrastructure for global-scale applications through edge caching and reactive state hydration.', 'Engineering', 12, '2026-10-12', false),
      ('roi-of-headless-commerce', 'The ROI of Headless Commerce', 'Why monolithic platforms are costing you 30% in conversion loss and how to pivot with zero downtime.', 'Growth Strategy', 5, '2026-10-08', false),
      ('micro-animations-for-saas-conversion', 'Micro-Animations for SaaS Conversion', 'Where motion earns its place in a product interface — and where it quietly costs you conversions.', 'Design', 8, '2026-09-15', false)
    ) as t(slug, title, excerpt, category, read_minutes, published_on, featured)
  loop
    select id into v_page from public.pages where slug = 'blog/' || r.slug;
    if v_page is not null then continue; end if;

    insert into public.pages (title, slug, status, page_type, published_at)
    values (r.title, 'blog/' || r.slug, 'published', 'post', r.published_on::timestamptz)
    returning id into v_page;

    insert into public.page_versions (page_id, version_number, blocks, seo, is_draft)
    values (v_page, 1,
      jsonb_build_array(
        jsonb_build_object('id','hero','kind','hero','variant','Default','visible',true,
          'data', jsonb_build_object('eyebrow', upper(r.category), 'heading', r.title, 'body', r.excerpt)),
        jsonb_build_object('id','body','kind','richText','variant','Default','visible',true,
          'data', jsonb_build_object('html','<p>' || r.excerpt || '</p>'))),
      jsonb_build_object('title', r.title, 'description', r.excerpt), false)
    returning id into v_ver;

    update public.pages set published_version_id = v_ver where id = v_page;

    insert into public.content_details (page_id, excerpt, category, read_minutes, published_on, is_featured)
    values (v_page, r.excerpt, r.category, r.read_minutes, r.published_on::date, r.featured)
    on conflict (page_id) do nothing;
  end loop;
end $$;

select private.record_migration('0059', 'seed_blog_posts_into_cms');
