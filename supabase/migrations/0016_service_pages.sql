-- =============================================================================
-- 0016_service_pages.sql
--
-- CMS — services, built on the page engine.
--
-- A service does not need its own tables. It needs a slug under services/, a
-- marker so the admin can list services apart from landing pages, and the
-- block structure a service page always has. Draft and publish, versions,
-- media, navigation and the public renderer are already solved by pages —
-- duplicating them into a `services` table would have bought nothing and
-- doubled the surface that has to stay correct.
--
-- SAFE TO RE-RUN. Requires 0014_page_templates.sql.
-- =============================================================================

-- 'services' leaves the reserved list so services/<name> is allowed. The bare
-- /services index is still a typed route, and typed routes take priority over
-- the catch-all resolver, so nothing can shadow it.
alter table public.pages drop constraint if exists pages_slug_reserved;
alter table public.pages add constraint pages_slug_reserved check (
  split_part(slug, '/', 1) not in
    ('admin','client','staff','auth','api','_next','blog',
     'case-studies','legal','privacy','terms','pricing','about','contact')
);

create index if not exists pages_type_idx on public.pages (page_type);

insert into public.page_templates (id,name,description,category,is_system,display_order,blocks) values
('service','Service page',
 'Hero, what we offer, benefits, pricing, FAQ and a closing call to action.','service',true,4,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"eyebrow":"Service","heading":"Service name","body":"One sentence on what this service does and who it is for.","ctaLabel":"Talk to us","ctaHref":"/contact"}},
   {"id":"t2","kind":"featureGrid","variant":"Default","visible":true,
    "data":{"heading":"What we offer","items":[
      {"title":"First offering","body":"What is included and why it matters."},
      {"title":"Second offering","body":"Keep each one to a single idea."},
      {"title":"Third offering","body":"Add as many as the service needs."}]}},
   {"id":"t3","kind":"featureGrid","variant":"Default","visible":true,
    "data":{"heading":"Benefits","items":[
      {"title":"Lower cost","body":"State the outcome, not the activity."},
      {"title":"Faster delivery","body":"Quantify it where you can."}]}},
   {"id":"t4","kind":"pricing","variant":"Default","visible":true,
    "data":{"heading":"Packages","items":[
      {"name":"Starter","price":"$499","interval":"month","ctaLabel":"Get started","ctaHref":"/contact","features":[{"label":"Core delivery"}]},
      {"name":"Professional","price":"$999","interval":"month","featured":true,"badge":"Most popular","ctaLabel":"Get started","ctaHref":"/contact","features":[{"label":"Everything in Starter"},{"label":"Priority support"}]},
      {"name":"Enterprise","price":"Custom","ctaLabel":"Contact sales","ctaHref":"/contact","features":[{"label":"Bespoke scope"}]}]}},
   {"id":"t5","kind":"testimonials","variant":"Default","visible":true,
    "data":{"heading":"What clients say","items":[{"quote":"Replace with a real quote.","name":"Client name","role":"Role, Company"}]}},
   {"id":"t6","kind":"faq","variant":"Default","visible":true,
    "data":{"heading":"Frequently asked","items":[
      {"question":"How long does it take?","answer":"Typical engagements run 6 to 12 weeks."},
      {"question":"How do we start?","answer":"A discovery call, then a written proposal."}]}},
   {"id":"t7","kind":"cta","variant":"Default","visible":true,
    "data":{"heading":"Ready to begin?","body":"Tell us what you are trying to achieve.","ctaLabel":"Book a call","ctaHref":"/book-meeting"}}]'::jsonb)
on conflict (id) do update set name=excluded.name, description=excluded.description,
  category=excluded.category, blocks=excluded.blocks, display_order=excluded.display_order;

select private.record_migration('0016','service_pages');
