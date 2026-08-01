-- =============================================================================
-- 0012_pages_and_versions.sql
--
-- CMS Phase 2/3/4 — persistent pages with draft/published separation.
--
-- The audit found something more basic than "edits do not persist": PageBlock
-- had no content payload at all. `variant` was a human-readable label
-- describing how a block was configured, not the configuration. Storage built
-- on that would have persisted captions. So a block now carries `data`, a
-- JSONB object holding what the block actually says.
--
-- Blocks live INSIDE the version rather than in their own table. A publish is
-- then a single row write instead of a cascade across children, which is what
-- makes it atomic — and the block tree is always read whole anyway, never
-- queried across pages.
--
-- SAFE TO RE-RUN. Requires 0010_media_library.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='page_status') then
    create type public.page_status as enum
      ('draft','published','scheduled','unpublished','archived');
  end if;
end $$;

-- ----------------------------------------------------------------- pages ----

create table if not exists public.pages (
  id             uuid primary key default gen_random_uuid(),
  -- Full path without a leading slash: 'promo/summer-sale'. One column so the
  -- resolver can match a catch-all route with a single equality lookup.
  slug           text not null,
  title          text not null,
  internal_name  text not null default '',
  page_type      text not null default 'standard',
  status         public.page_status not null default 'draft',
  -- Set only by publish_page(). A NULL pointer means nothing is public yet,
  -- which is what the resolver checks.
  published_version_id uuid,
  scheduled_at   timestamptz,
  nav_in_main    boolean not null default false,
  nav_label      text,
  nav_parent     text,
  created_by     uuid references public.profiles (id) on delete set null,
  updated_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  published_at   timestamptz,
  constraint pages_slug_shape check (slug ~ '^[a-z0-9]+(?:[-/][a-z0-9]+)*$'),
  -- Reserved prefixes. A page slugged 'admin' would shadow the whole portal.
  constraint pages_slug_reserved check (
    split_part(slug, '/', 1) not in
      ('admin','client','staff','auth','api','_next','blog','services',
       'case-studies','legal','privacy','terms','pricing','about','contact')
  )
);

comment on table public.pages is
  'Page identity and publish pointer. Content lives in page_versions.';

create unique index if not exists pages_slug_key   on public.pages (slug);
create index if not exists pages_status_idx        on public.pages (status);
create index if not exists pages_scheduled_idx     on public.pages (scheduled_at)
  where status = 'scheduled';

drop trigger if exists pages_set_updated_at on public.pages;
create trigger pages_set_updated_at before update on public.pages
  for each row execute function private.set_updated_at();

-- -------------------------------------------------------- page versions ----

create table if not exists public.page_versions (
  id             uuid primary key default gen_random_uuid(),
  page_id        uuid not null references public.pages (id) on delete cascade,
  version_number int not null,
  -- The block tree. Each entry: { id, kind, variant, visible, data }.
  blocks         jsonb not null default '[]'::jsonb,
  seo            jsonb not null default '{}'::jsonb,
  -- Exactly one draft per page; published versions are immutable history.
  is_draft       boolean not null default true,
  created_by     uuid references public.profiles (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint page_versions_blocks_is_array check (jsonb_typeof(blocks) = 'array')
);

comment on table public.page_versions is
  'Immutable snapshots plus one live draft per page. Publishing copies the '
  'draft into a new frozen version and repoints pages.published_version_id.';

create unique index if not exists page_versions_number_key
  on public.page_versions (page_id, version_number);
-- At most one draft per page, enforced by the database rather than by code.
create unique index if not exists page_versions_one_draft
  on public.page_versions (page_id) where is_draft;
create index if not exists page_versions_page_idx on public.page_versions (page_id, created_at desc);

drop trigger if exists page_versions_set_updated_at on public.page_versions;
create trigger page_versions_set_updated_at before update on public.page_versions
  for each row execute function private.set_updated_at();

do $$
begin
  if not exists (select 1 from pg_constraint where conname='pages_published_version_fk') then
    alter table public.pages
      add constraint pages_published_version_fk
      foreign key (published_version_id) references public.page_versions (id)
      on delete set null;
  end if;
end $$;

create index if not exists pages_published_version_idx on public.pages (published_version_id);

-- A published version must never be edited again; history has to stay honest.
create or replace function private.freeze_published_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.is_draft = false and (select auth.uid()) is not null then
    raise exception 'published versions are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.freeze_published_version() from public, anon, authenticated;

drop trigger if exists page_versions_freeze on public.page_versions;
create trigger page_versions_freeze
  before update on public.page_versions
  for each row execute function private.freeze_published_version();

-- ------------------------------------------------------- publish engine ----
-- SECURITY INVOKER so the caller's RLS still applies — this is not a privilege
-- escalation point, it is a transaction boundary. One statement, so either the
-- frozen version, the pointer and the status all land, or none of them do.

create or replace function public.publish_page(p_page_id uuid)
returns uuid language plpgsql security invoker set search_path = public as $$
declare
  v_draft   public.page_versions;
  v_next    int;
  v_new_id  uuid;
  v_slug    text;
begin
  select slug into v_slug from public.pages where id = p_page_id;
  if v_slug is null then
    raise exception 'page not found' using errcode = 'P0002';
  end if;

  select * into v_draft from public.page_versions
   where page_id = p_page_id and is_draft;
  if v_draft is null then
    raise exception 'nothing to publish: this page has no draft' using errcode = 'P0002';
  end if;
  if jsonb_array_length(v_draft.blocks) = 0 then
    raise exception 'nothing to publish: the draft has no blocks' using errcode = '22023';
  end if;

  select coalesce(max(version_number), 0) + 1 into v_next
    from public.page_versions where page_id = p_page_id;

  -- Freeze a copy. The draft stays editable so the next edit does not start
  -- from an empty page.
  insert into public.page_versions
    (page_id, version_number, blocks, seo, is_draft, created_by)
  values
    (p_page_id, v_next, v_draft.blocks, v_draft.seo, false, (select auth.uid()))
  returning id into v_new_id;

  update public.pages
     set published_version_id = v_new_id,
         status               = 'published',
         published_at         = now(),
         scheduled_at         = null,
         updated_by           = (select auth.uid())
   where id = p_page_id;

  return v_new_id;
end;
$$;

revoke all on function public.publish_page(uuid) from public, anon;
grant execute on function public.publish_page(uuid) to authenticated;

create or replace function public.unpublish_page(p_page_id uuid)
returns void language plpgsql security invoker set search_path = public as $$
begin
  -- The pointer is cleared so the resolver stops finding it, but the frozen
  -- versions remain as history and the draft remains editable.
  update public.pages
     set published_version_id = null,
         status               = 'unpublished',
         updated_by           = (select auth.uid())
   where id = p_page_id;
end;
$$;
revoke all on function public.unpublish_page(uuid) from public, anon;
grant execute on function public.unpublish_page(uuid) to authenticated;

-- ------------------------------------------------------------------ RLS ----

alter table public.pages         enable row level security;
alter table public.page_versions enable row level security;

drop policy if exists pages_select_public    on public.pages;
drop policy if exists pages_select_editor    on public.pages;
drop policy if exists pages_insert_editor    on public.pages;
drop policy if exists pages_update_editor    on public.pages;
drop policy if exists pages_delete_editor    on public.pages;

-- Anon sees ONLY pages with a published pointer. An unpublished draft is
-- invisible to the public API, not merely hidden by the UI.
create policy pages_select_public on public.pages
  for select to anon
  using (published_version_id is not null and status = 'published');

create policy pages_select_editor on public.pages
  for select to authenticated
  using (private.can_edit_content() or (published_version_id is not null and status = 'published'));

create policy pages_insert_editor on public.pages
  for insert to authenticated with check (private.can_edit_content());
create policy pages_update_editor on public.pages
  for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy pages_delete_editor on public.pages
  for delete to authenticated using (private.can_edit_content());

drop policy if exists page_versions_select_public on public.page_versions;
drop policy if exists page_versions_select_editor on public.page_versions;
drop policy if exists page_versions_insert_editor on public.page_versions;
drop policy if exists page_versions_update_editor on public.page_versions;
drop policy if exists page_versions_delete_editor on public.page_versions;

-- Anon may read a version only while it is the one a published page points at.
create policy page_versions_select_public on public.page_versions
  for select to anon
  using (exists (
    select 1 from public.pages p
     where p.published_version_id = page_versions.id and p.status = 'published'
  ));

create policy page_versions_select_editor on public.page_versions
  for select to authenticated
  using (private.can_edit_content() or exists (
    select 1 from public.pages p
     where p.published_version_id = page_versions.id and p.status = 'published'
  ));

create policy page_versions_insert_editor on public.page_versions
  for insert to authenticated with check (private.can_edit_content());
create policy page_versions_update_editor on public.page_versions
  for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy page_versions_delete_editor on public.page_versions
  for delete to authenticated using (private.can_edit_content());

-- -------------------------------------------------------------- realtime ---

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='pages') then
    alter publication supabase_realtime add table public.pages;
  end if;
end $$;

select private.record_migration('0012', 'pages_and_versions');
