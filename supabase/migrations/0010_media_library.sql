-- =============================================================================
-- 0010_media_library.sql
--
-- CMS Feature 1 — Media Library.
--
-- Sequenced first because nearly every content entity that follows references
-- an image: services carry a thumbnail, a hero and a gallery; case studies
-- carry media and client logos; blocks carry backgrounds. Adding this after
-- them would mean backfilling every one of those tables.
--
-- Two things are deliberately separated:
--   * The BYTES live in Supabase Storage, which handles CDN delivery, range
--     requests and transformation.
--   * The METADATA lives here, because alt text, captions and usage are
--     editorial content that has to be queryable and is not expressible as
--     object metadata.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='media_kind') then
    create type public.media_kind as enum ('image','video','document','logo');
  end if;
end $$;

create table if not exists public.media_assets (
  id            uuid primary key default gen_random_uuid(),
  -- Path inside the `media` bucket. Unique so the same object cannot be
  -- registered twice and later deleted twice.
  storage_path  text not null,
  public_url    text not null,
  filename      text not null,
  mime_type     text not null,
  kind          public.media_kind not null default 'image',
  size_bytes    bigint not null default 0 check (size_bytes >= 0),
  -- Intrinsic dimensions, so a renderer can reserve space and avoid layout
  -- shift without downloading the file first.
  width         int check (width  is null or width  > 0),
  height        int check (height is null or height > 0),
  -- Empty string is meaningful: it marks an image as decorative, which is not
  -- the same as alt text nobody has written yet (NULL).
  alt_text      text,
  title         text,
  caption       text,
  folder        text not null default '',
  uploaded_by   uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint media_alt_length     check (char_length(alt_text) <= 300),
  constraint media_title_length   check (char_length(title)    <= 200),
  constraint media_caption_length check (char_length(caption)  <= 600),
  constraint media_folder_shape   check (folder ~ '^[a-z0-9/-]*$')
);

comment on table public.media_assets is
  'Editorial metadata for objects in the `media` storage bucket. Bytes live in '
  'storage; alt text, captions and folders live here because they are content.';

create unique index if not exists media_assets_path_key on public.media_assets (storage_path);
create index if not exists media_assets_kind_idx        on public.media_assets (kind);
create index if not exists media_assets_folder_idx      on public.media_assets (folder);
create index if not exists media_assets_uploaded_by_idx on public.media_assets (uploaded_by);
create index if not exists media_assets_created_idx     on public.media_assets (created_at desc);

-- Free-text search over the fields an editor actually recalls a file by.
create index if not exists media_assets_search_idx on public.media_assets
  using gin (to_tsvector('english',
    coalesce(filename,'') || ' ' || coalesce(title,'') || ' ' || coalesce(alt_text,'')));

drop trigger if exists media_assets_set_updated_at on public.media_assets;
create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function private.set_updated_at();

-- ------------------------------------------------- who may manage content ---
-- Reuses the `content-publishing` module seeded in 0007 rather than inventing
-- a second permission concept, so the Access Control console already governs
-- this and the nav filter already hides it from roles that cannot use it.

create or replace function private.can_edit_content()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    private.is_admin()
    or exists (
      select 1
        from public.profiles p
        join public.role_grants g on g.role_id = p.role_id
       where p.id = (select auth.uid())
         and p.is_active
         and g.module_id = 'content-publishing'
         and g.level >= 'edit'
    ), false);
$$;
revoke all on function private.can_edit_content() from public, anon;
grant execute on function private.can_edit_content() to authenticated;

-- ------------------------------------------------------------------ RLS ----

alter table public.media_assets enable row level security;

drop policy if exists media_assets_select        on public.media_assets;
drop policy if exists media_assets_insert_editor on public.media_assets;
drop policy if exists media_assets_update_editor on public.media_assets;
drop policy if exists media_assets_delete_editor on public.media_assets;

-- Readable by anon as well as authenticated. The public site renders these
-- images and needs their alt text server-side, and every field here is already
-- public the moment the URL is: the bucket serves the bytes without RLS.
create policy media_assets_select on public.media_assets
  for select to anon, authenticated
  using (true);

create policy media_assets_insert_editor on public.media_assets
  for insert to authenticated with check (private.can_edit_content());
create policy media_assets_update_editor on public.media_assets
  for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy media_assets_delete_editor on public.media_assets
  for delete to authenticated using (private.can_edit_content());

-- ----------------------------------------------------- storage + policies ---

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media','media', true, 26214400,
        array['image/png','image/jpeg','image/webp','image/gif','image/svg+xml','image/avif',
              'video/mp4','video/webm','application/pdf'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists media_read        on storage.objects;
drop policy if exists media_list_editor on storage.objects;
drop policy if exists media_write_editor on storage.objects;
drop policy if exists media_update_editor on storage.objects;
drop policy if exists media_delete_editor on storage.objects;

-- Public bucket: object URLs resolve without RLS, so the only thing a SELECT
-- policy grants is list(). Scoped to editors rather than everyone, so the
-- library cannot be enumerated anonymously — the mistake 0006 fixed on avatars.
create policy media_list_editor on storage.objects
  for select to authenticated
  using (bucket_id = 'media' and private.can_edit_content());

create policy media_write_editor on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and private.can_edit_content());
create policy media_update_editor on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and private.can_edit_content());
create policy media_delete_editor on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and private.can_edit_content());

-- -------------------------------------------------------------- realtime ---
-- Targeted: an editor uploading in one tab should see it in another, and the
-- picker inside the page builder should not need a manual refresh.

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='media_assets') then
    alter publication supabase_realtime add table public.media_assets;
  end if;
end $$;

select private.record_migration('0010', 'media_library');
