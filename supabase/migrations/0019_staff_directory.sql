-- =============================================================================
-- 0019_staff_directory.sql
--
-- Staff directory.
--
-- lib/team.ts is 73 lines but has 10 importers: the About roster, project
-- assignee avatars, TeamPresence and the staff screens all read it. It is the
-- cheapest module to migrate and the widest unblock.
--
-- Staff are NOT a new identity. A staff member is a profile on the STAFF
-- portal; this table shares that primary key and adds only the public-facing
-- and organisational attributes a profile does not carry — department, skills,
-- whether they appear on the public roster, and their order there. No name or
-- email is duplicated, so the two can never disagree.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'department') then
    create type public.department as enum
      ('Architectural Council','Growth Operations','Creative Engineering','Core Engineering');
  end if;
end $$;

create table if not exists public.staff_profiles (
  -- Shares the profile's primary key: one staff record per person, and the
  -- link cannot drift.
  id            uuid primary key references public.profiles (id) on delete cascade,
  slug          text not null,
  display_role  text not null default '',
  department    public.department,
  skills        text[] not null default '{}',
  -- Appears on the public About page. Off by default: joining the company
  -- should not publish someone's face without a decision.
  is_public     boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint staff_slug_shape check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint staff_skills_bounded
    check (array_length(skills, 1) is null or array_length(skills, 1) <= 12)
);

comment on table public.staff_profiles is
  'Public and organisational attributes for a profile on the STAFF portal. '
  'Identity itself stays in profiles; this never duplicates a name or email.';

create unique index if not exists staff_profiles_slug_key on public.staff_profiles (slug);
create index if not exists staff_profiles_public_idx on public.staff_profiles (display_order)
  where is_public;
create index if not exists staff_profiles_department_idx on public.staff_profiles (department);

drop trigger if exists staff_profiles_set_updated_at on public.staff_profiles;
create trigger staff_profiles_set_updated_at before update on public.staff_profiles
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------------ RLS ----

alter table public.staff_profiles enable row level security;

drop policy if exists staff_profiles_select       on public.staff_profiles;
drop policy if exists staff_profiles_insert_admin on public.staff_profiles;
drop policy if exists staff_profiles_update_admin on public.staff_profiles;
drop policy if exists staff_profiles_delete_admin on public.staff_profiles;

-- Signed-in users see the whole directory; anon sees only the public roster.
-- Splitting it here means the About page can render server-side with the anon
-- key without exposing internal staff records.
create policy staff_profiles_select on public.staff_profiles
  for select to anon, authenticated
  using (is_public or (select auth.uid()) is not null);

create policy staff_profiles_insert_admin on public.staff_profiles
  for insert to authenticated with check (private.is_admin());
create policy staff_profiles_update_admin on public.staff_profiles
  for update to authenticated
  using (private.is_admin() or id = (select auth.uid()))
  with check (private.is_admin() or id = (select auth.uid()));
create policy staff_profiles_delete_admin on public.staff_profiles
  for delete to authenticated using (private.is_admin());

-- --------------------------------------------------------------- guards ----

-- A staff member must not publish themselves to the public roster, change
-- their department, or reorder the roster — those are editorial and
-- organisational decisions. They may still edit their own skills.
create or replace function private.guard_staff_public_fields()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.is_public       is distinct from old.is_public
      or new.department    is distinct from old.department
      or new.display_order is distinct from old.display_order
      or new.slug          is distinct from old.slug)
     and (select auth.uid()) is not null
     and not private.is_admin()
  then
    raise exception
      'slug, department, display_order and is_public may only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_staff_public_fields() from public, anon, authenticated;

drop trigger if exists staff_profiles_guard on public.staff_profiles;
create trigger staff_profiles_guard before update on public.staff_profiles
  for each row execute function private.guard_staff_public_fields();

-- A staff record only makes sense for a STAFF or ADMIN portal profile.
-- Without this, a CLIENT could be given a staff record and appear on the
-- roster while being unable to sign in to the workspace.
create or replace function private.guard_staff_portal()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.profiles p
     where p.id = new.id and p.portal in ('STAFF','ADMIN')
  ) then
    raise exception 'staff records require a STAFF or ADMIN profile'
      using errcode = '23514';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_staff_portal() from public, anon, authenticated;

drop trigger if exists staff_profiles_portal_guard on public.staff_profiles;
create trigger staff_profiles_portal_guard before insert on public.staff_profiles
  for each row execute function private.guard_staff_portal();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'staff_profiles') then
    alter publication supabase_realtime add table public.staff_profiles;
  end if;
end $$;

select private.record_migration('0019', 'staff_directory');
