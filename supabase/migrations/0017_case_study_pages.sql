-- =============================================================================
-- 0017_case_study_pages.sql
--
-- CMS — case studies, on the page engine. Same reasoning as 0016: a case study
-- is a page with a slug under case-studies/, a page_type marker, and the block
-- structure a case study always has. Draft and publish, versions, media,
-- navigation and the public renderer are already solved.
--
-- SAFE TO RE-RUN. Requires 0016_service_pages.sql.
-- =============================================================================

-- 'case-studies' leaves the reserved list so case-studies/<name> is allowed.
-- The bare /case-studies archive is a typed route and typed routes take
-- priority over the catch-all resolver, so nothing can shadow it.
alter table public.pages drop constraint if exists pages_slug_reserved;
alter table public.pages add constraint pages_slug_reserved check (
  split_part(slug, '/', 1) not in
    ('admin','client','staff','auth','api','_next','blog',
     'legal','privacy','terms','pricing','about','contact')
);

insert into public.page_templates (id,name,description,category,is_system,display_order,blocks) values
('case-study','Case study',
 'Client, challenge, solution, measurable results and a closing call to action.','case-study',true,5,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"eyebrow":"Case study","heading":"Client name","body":"One sentence on the outcome, not the activity.","ctaLabel":"Start a project","ctaHref":"/contact"}},
   {"id":"t2","kind":"featureGrid","variant":"Default","visible":true,
    "data":{"heading":"Results","items":[
      {"title":"+240%","body":"Revenue"},
      {"title":"-38%","body":"Cost per acquisition"},
      {"title":"3.8x","body":"Return on ad spend"}]}},
   {"id":"t3","kind":"richText","variant":"Default","visible":true,
    "data":{"heading":"The challenge","body":"What the client was up against, in their terms.\n\nKeep it concrete — a number the reader recognises beats an adjective."}},
   {"id":"t4","kind":"richText","variant":"Default","visible":true,
    "data":{"heading":"What we did","body":"The approach, in the order it happened.\n\nName the decisions that mattered and why they were made."}},
   {"id":"t5","kind":"testimonials","variant":"Default","visible":true,
    "data":{"heading":"In their words","items":[{"quote":"Replace with a real quote from the client.","name":"Client name","role":"Role, Company"}]}},
   {"id":"t6","kind":"cta","variant":"Default","visible":true,
    "data":{"heading":"Facing something similar?","body":"Tell us where you are and we will tell you what we would do.","ctaLabel":"Book a call","ctaHref":"/book-meeting"}}]'::jsonb)
on conflict (id) do update set name=excluded.name, description=excluded.description,
  category=excluded.category, blocks=excluded.blocks, display_order=excluded.display_order;

select private.record_migration('0017','case_study_pages');
