-- =============================================================================
-- 0014_page_templates.sql
--
-- CMS Phase 1 — real page templates.
--
-- The create wizard rendered three template cards that were pictures. Choosing
-- one produced "Draft not created — the pages API is not connected yet".
-- Templates are now rows carrying an actual block structure, so selecting one
-- instantiates real, editable blocks.
--
-- A template is COPIED into the new page's draft, never referenced. Editing a
-- template later must not silently rewrite pages already built from it.
--
-- SAFE TO RE-RUN. Requires 0012_pages_and_versions.sql.
-- =============================================================================

create table if not exists public.page_templates (
  id            text primary key,
  name          text not null,
  description   text not null default '',
  category      text not null default 'general',
  preview_url   text,
  -- The block tree instantiated into a new page's draft.
  blocks        jsonb not null default '[]'::jsonb,
  is_system     boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint page_templates_blocks_is_array check (jsonb_typeof(blocks) = 'array')
);

comment on table public.page_templates is
  'Starting block structures. Copied into a page draft on creation, never '
  'referenced, so later template edits cannot rewrite existing pages.';

create index if not exists page_templates_order_idx on public.page_templates (display_order);

drop trigger if exists page_templates_set_updated_at on public.page_templates;
create trigger page_templates_set_updated_at before update on public.page_templates
  for each row execute function private.set_updated_at();

alter table public.page_templates enable row level security;

drop policy if exists page_templates_select on public.page_templates;
drop policy if exists page_templates_write_editor on public.page_templates;
drop policy if exists page_templates_insert_editor on public.page_templates;
drop policy if exists page_templates_update_editor on public.page_templates;
drop policy if exists page_templates_delete_editor on public.page_templates;

create policy page_templates_select on public.page_templates
  for select to authenticated using (true);
create policy page_templates_insert_editor on public.page_templates
  for insert to authenticated with check (private.can_edit_content());
create policy page_templates_update_editor on public.page_templates
  for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy page_templates_delete_editor on public.page_templates
  for delete to authenticated using (private.can_edit_content());

-- Seed. Block ids are placeholders; createPage rewrites them so two pages from
-- the same template never share a block id.
insert into public.page_templates (id, name, description, category, is_system, display_order, blocks) values
('blank', 'Blank canvas',
 'One hero and nothing else. Build the page from scratch.', 'general', true, 1,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"heading":"New page","body":""}}]'::jsonb),

('product-launch', 'Product Launch Pro',
 'Hero, feature grid, testimonials and a closing call to action.', 'marketing', true, 2,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"eyebrow":"Now available","heading":"Introducing your product","body":"One sentence on what it does and who it is for.","ctaLabel":"Get started","ctaHref":"/contact"}},
   {"id":"t2","kind":"featureGrid","variant":"Default","visible":true,
    "data":{"heading":"What you get","items":[
      {"title":"First capability","body":"Explain the benefit, not the mechanism."},
      {"title":"Second capability","body":"Keep each one to a single idea."},
      {"title":"Third capability","body":"Three is usually enough above the fold."}]}},
   {"id":"t3","kind":"testimonials","variant":"Default","visible":true,
    "data":{"heading":"What customers say","items":[
      {"quote":"Replace with a real quote.","name":"Customer name","role":"Role, Company"}]}},
   {"id":"t4","kind":"cta","variant":"Default","visible":true,
    "data":{"heading":"Ready to start?","body":"Tell them what happens next.","ctaLabel":"Talk to us","ctaHref":"/contact"}}]'::jsonb),

('pricing-master', 'Pricing Page Master',
 'Hero, three-tier pricing, FAQ and a closing call to action.', 'commerce', true, 3,
 '[{"id":"t1","kind":"hero","variant":"Default","visible":true,
    "data":{"heading":"Simple, transparent pricing","body":"No hidden fees. Cancel any time."}},
   {"id":"t2","kind":"pricing","variant":"Default","visible":true,
    "data":{"heading":"Choose a plan","items":[
      {"name":"Starter","price":"$499","interval":"month","body":"For small teams getting going.","ctaLabel":"Choose Starter","ctaHref":"/contact","features":[{"label":"Up to 3 users"},{"label":"Email support"}]},
      {"name":"Professional","price":"$999","interval":"month","featured":true,"badge":"Most popular","body":"For growing businesses.","ctaLabel":"Choose Professional","ctaHref":"/contact","features":[{"label":"Up to 10 users"},{"label":"Priority support"},{"label":"Advanced reporting"}]},
      {"name":"Enterprise","price":"Custom","body":"For organisations with bespoke needs.","ctaLabel":"Contact sales","ctaHref":"/contact","features":[{"label":"Unlimited users"},{"label":"Dedicated manager"}]}]}},
   {"id":"t3","kind":"faq","variant":"Default","visible":true,
    "data":{"heading":"Frequently asked","items":[
      {"question":"Can I change plan later?","answer":"Yes, at any time."},
      {"question":"Is there a contract?","answer":"No, all plans are monthly."}]}},
   {"id":"t4","kind":"cta","variant":"Default","visible":true,
    "data":{"heading":"Still deciding?","body":"We will walk you through it.","ctaLabel":"Book a call","ctaHref":"/book-meeting"}}]'::jsonb)
on conflict (id) do update
  set name=excluded.name, description=excluded.description,
      category=excluded.category, blocks=excluded.blocks,
      display_order=excluded.display_order;

select private.record_migration('0014', 'page_templates');
