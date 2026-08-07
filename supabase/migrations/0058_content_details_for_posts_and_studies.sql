-- =============================================================================
-- 0058_content_details_for_posts_and_studies.sql
--
-- Card metadata for editorial pages.
--
-- The same companion-table shape service_details uses: the page owns the
-- content, the slug and the publish state, and this adds only the fields a page
-- does not have. Blog posts and case studies were static TypeScript modules, so
-- publishing from the admin changed nothing a visitor could see.
--
-- SAFE TO RE-RUN. Requires 0028 (service_details precedent) and 0034.
-- =============================================================================

create table if not exists public.content_details (
  page_id       uuid primary key references public.pages (id) on delete cascade,
  excerpt       text,
  category      text,
  cover_url     text,
  author_id     uuid references public.profiles (id) on delete set null,
  read_minutes  int check (read_minutes is null or read_minutes between 1 and 180),
  published_on  date,
  is_featured   boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists content_details_author_idx    on public.content_details (author_id);
create index if not exists content_details_published_idx on public.content_details (published_on desc);
create index if not exists content_details_category_idx  on public.content_details (category);

drop trigger if exists content_details_set_updated_at on public.content_details;
create trigger content_details_set_updated_at before update on public.content_details
  for each row execute function private.set_updated_at();

alter table public.content_details enable row level security;

-- Mirrors service_details exactly, including the lesson from 0048: an
-- unpublished draft's excerpt must not be readable off the API while its page
-- correctly 404s. Publication is the publish pointer, not the status alone.
drop policy if exists content_details_select_public on public.content_details;
create policy content_details_select_public on public.content_details
  for select to anon
  using (exists (
    select 1 from public.pages p
    where p.id = content_details.page_id
      and p.status = 'published'
      and p.published_version_id is not null));

drop policy if exists content_details_select_editor on public.content_details;
create policy content_details_select_editor on public.content_details
  for select to authenticated
  using (
    private.can_edit_content() or private.is_admin()
    or exists (
      select 1 from public.pages p
      where p.id = content_details.page_id
        and p.status = 'published'
        and p.published_version_id is not null));

drop policy if exists content_details_write on public.content_details;
create policy content_details_write on public.content_details
  for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());

drop policy if exists content_details_update on public.content_details;
create policy content_details_update on public.content_details
  for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());

drop policy if exists content_details_delete on public.content_details;
create policy content_details_delete on public.content_details
  for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

do $$
begin
  if not exists (select 1 from pg_publication_tables
                 where pubname='supabase_realtime' and schemaname='public'
                   and tablename='content_details') then
    alter publication supabase_realtime add table public.content_details;
  end if;
end $$;

select private.record_migration('0058', 'content_details_for_posts_and_studies');
