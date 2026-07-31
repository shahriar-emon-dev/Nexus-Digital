-- =============================================================================
-- 0004_user_profiles.sql
--
-- Feature 2 — User Profiles.
--
-- 0001 gave `profiles` identity only: the columns sign-in and the route guard
-- need. This adds the fields a person actually edits, plus the organisation
-- they belong to, so registration stops discarding the company, industry and
-- phone it already collects.
--
-- Scope note: the public About-page roster stays in lib/team.ts for now. Making
-- it dynamic requires anon read access to `profiles`, and RLS is row-level, not
-- column-level — an anon policy would expose email addresses along with the
-- names. That roster is public content rather than profile data and moves with
-- the content features.
--
-- SAFE TO RE-RUN. Requires 0001_authentication.sql.
-- =============================================================================

-- --------------------------------------------------------- organizations ----

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  industry    text,
  -- Account health shown on the client overview. Derived by the app today;
  -- becomes a computed rollup once projects and invoices are migrated.
  tier        text not null default 'Standard',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.organizations is
  'Client companies. One row per customer account; profiles link to it.';

create unique index if not exists organizations_slug_key       on public.organizations (slug);
create unique index if not exists organizations_name_lower_key on public.organizations (lower(name));

drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------ profile columns ----
-- Added individually with IF NOT EXISTS so the migration converges whether it
-- runs against 0001's shape or its own.

alter table public.profiles add column if not exists organization_id uuid
  references public.organizations (id) on delete set null;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone      text;
alter table public.profiles add column if not exists job_title  text;
alter table public.profiles add column if not exists bio        text;
alter table public.profiles add column if not exists timezone   text not null default 'UTC';
alter table public.profiles add column if not exists locale     text not null default 'en';

comment on column public.profiles.organization_id is
  'Client accounts belong to an organisation. Staff and admins normally do not.';

create index if not exists profiles_organization_id_idx on public.profiles (organization_id);

-- Length ceilings so a profile edit cannot be used to store arbitrary payloads.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_bio_length') then
    alter table public.profiles add constraint profiles_bio_length check (char_length(bio) <= 600);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_full_name_length') then
    alter table public.profiles add constraint profiles_full_name_length check (char_length(full_name) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_phone_length') then
    alter table public.profiles add constraint profiles_phone_length check (char_length(phone) <= 40);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_job_title_length') then
    alter table public.profiles add constraint profiles_job_title_length check (char_length(job_title) <= 120);
  end if;
end $$;

-- ------------------------------------------------------- signup handling ----
-- Registration collects company, industry and phone. Those are user-supplied
-- descriptive fields, not privilege-bearing, so unlike portal and role_id they
-- are safe to read from signup metadata.

create or replace function private.slugify(p text)
returns text language sql immutable set search_path = '' as $$
  select trim(both '-' from regexp_replace(lower(coalesce(p,'')), '[^a-z0-9]+', '-', 'g'));
$$;

create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_company text := nullif(trim(new.raw_user_meta_data ->> 'company'), '');
  v_slug    text;
  v_org     uuid;
begin
  if v_company is not null then
    v_slug := private.slugify(v_company);
    -- Match an existing organisation case-insensitively before creating one,
    -- so "Northwind" and "northwind retail " do not become separate accounts.
    select id into v_org from public.organizations where lower(name) = lower(v_company);
    if v_org is null then
      insert into public.organizations (name, slug, industry)
      values (v_company, v_slug, nullif(trim(new.raw_user_meta_data ->> 'industry'), ''))
      on conflict (lower(name)) do nothing
      returning id into v_org;
      if v_org is null then
        select id into v_org from public.organizations where lower(name) = lower(v_company);
      end if;
    end if;
  end if;

  insert into public.profiles (id, email, full_name, portal, role_id, phone, organization_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'CLIENT',   -- never from metadata: that payload is attacker-controlled
    null,
    nullif(trim(new.raw_user_meta_data ->> 'phone'), ''),
    v_org
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.slugify(text)     from public, anon, authenticated;

-- ------------------------------------------------ organisation visibility ---

create or replace function private.current_org_id()
returns uuid language sql stable security definer set search_path = '' as $$
  select p.organization_id from public.profiles p where p.id = (select auth.uid());
$$;

revoke all on function private.current_org_id() from public, anon;
grant execute on function private.current_org_id() to authenticated;

alter table public.organizations enable row level security;

drop policy if exists organizations_select on public.organizations;
drop policy if exists organizations_write_admin on public.organizations;
drop policy if exists organizations_insert_admin on public.organizations;
drop policy if exists organizations_update_admin on public.organizations;
drop policy if exists organizations_delete_admin on public.organizations;

-- A user sees their own organisation. Admins see all. One policy, so the
-- planner evaluates a single expression per row.
create policy organizations_select on public.organizations
  for select to authenticated
  using (
    id = private.current_org_id()
    or private.is_admin()
  );

create policy organizations_insert_admin on public.organizations
  for insert to authenticated with check (private.is_admin());

create policy organizations_update_admin on public.organizations
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

create policy organizations_delete_admin on public.organizations
  for delete to authenticated using (private.is_admin());

-- ------------------------------------------------------- avatar storage ----

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152,
        array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists avatars_read           on storage.objects;
drop policy if exists avatars_insert_own     on storage.objects;
drop policy if exists avatars_update_own     on storage.objects;
drop policy if exists avatars_delete_own     on storage.objects;

-- Public bucket: avatars render in the browser without a signed URL.
create policy avatars_read on storage.objects
  for select to public
  using (bucket_id = 'avatars');

-- Writes are confined to a folder named after the user's own id, so one user
-- cannot overwrite another's avatar by guessing a path.
create policy avatars_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy avatars_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

select private.record_migration('0004', 'user_profiles');
