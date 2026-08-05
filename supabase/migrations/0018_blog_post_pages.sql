-- =============================================================================
-- 0018_blog_post_pages.sql
--
-- CMS — blog posts, on the page engine. Same reasoning as 0016 and 0017: a
-- post is a page with a slug under blog/, a page_type marker, and the block
-- structure a post always has. Draft and publish, versions, media, navigation
-- and the public renderer are already solved.
--
-- SAFE TO RE-RUN. Requires 0017_case_study_pages.sql.
-- =============================================================================

-- 'blog' leaves the reserved list so blog/<slug> is allowed. The bare /blog
-- index is a typed route and typed routes take priority over the catch-all.
alter table public.pages drop constraint if exists pages_slug_reserved;
alter table public.pages add constraint pages_slug_reserved check (
  split_part(slug, '/', 1) not in
    ('admin','client','staff','auth','api','_next',
     'legal','privacy','terms','pricing','about','contact')
);

insert into public.page_templates (id,name,description,category,is_system,display_order,blocks) values
('blog-post','Blog post',
 'Lead paragraph, body sections and a closing call to action.','blog',true,6,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"eyebrow":"Insight","heading":"Post title","body":"The one sentence a reader should take away if they read nothing else."}},
   {"id":"t2","kind":"richText","variant":"Default","visible":true,
    "data":{"heading":"","body":"Open with the problem, not the preamble.\n\nSecond paragraph. Blank lines separate paragraphs; the renderer never treats this as HTML, so pasted markup is shown as text rather than executed."}},
   {"id":"t3","kind":"richText","variant":"Default","visible":true,
    "data":{"heading":"What we learned","body":"The substance of the post.\n\nBe specific — a number a reader recognises beats an adjective."}},
   {"id":"t4","kind":"cta","variant":"Default","visible":true,
    "data":{"heading":"Working on something similar?","body":"Tell us where you are and we will tell you what we would do.","ctaLabel":"Get in touch","ctaHref":"/contact"}}]'::jsonb)
on conflict (id) do update set name=excluded.name, description=excluded.description,
  category=excluded.category, blocks=excluded.blocks, display_order=excluded.display_order;

select private.record_migration('0018','blog_post_pages');
