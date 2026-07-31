-- =============================================================================
-- 0001_authentication.sql
--
-- Feature 1 — Authentication.
--
-- Supabase Auth owns credentials, sessions and MFA factors in the `auth`
-- schema. This migration adds the application-side identity that `auth.users`
-- cannot express: which portal a user belongs to and which role they hold.
--
-- Scope: `profiles` carries IDENTITY ONLY — the columns the sign-in flow and
-- the route guard need. Rich profile fields land in Feature 2 (User Profiles);
-- the permission grant matrix lands in Feature 3 (Roles & Permissions).
--
-- SECURITY DEFINER helpers live in `private`, not `public`. Every function in
-- `public` is published by PostgREST as /rest/v1/rpc/<name>; trigger functions
-- have no business being callable over HTTP, and the policy helpers only need
-- to be reachable from inside policy expressions.
--
-- SAFE TO RE-RUN. Requires 0000_migration_registry.sql.
-- =============================================================================

create schema if not exists private;
grant usage on schema private to authenticated;

-- ----------------------------------------------------------------- types ----

do $$
begin
  if not exists (
    select 1 from pg_type t
      join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'portal'
  ) then
    create type public.portal as enum ('ADMIN', 'STAFF', 'CLIENT');
  end if;
end $$;

-- ----------------------------------------------------------------- roles ----
-- Text primary key rather than uuid: these ids are referenced by name in
-- application code (`global-admin`, `project-lead`) and by the route guard, so
-- a stable human-readable key is worth more here than a surrogate.

create table if not exists public.roles (
  id          text primary key,
  name        text not null unique,
  description text not null default '',
  is_system   boolean not null default false,
  created_at  timestamptz not null default now()
);

comment on table public.roles is
  'Assignable roles. System roles cannot be deleted; only their grants change.';

-- -------------------------------------------------------------- profiles ----

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text not null,
  full_name    text not null default '',
  portal       public.portal not null default 'CLIENT',
  role_id      text references public.roles (id) on delete set null,
  is_active    boolean not null default true,
  last_seen_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is
  'Application identity, one row per auth.users record. Created automatically '
  'by the on_auth_user_created trigger.';

-- Case-insensitive uniqueness without requiring the citext extension.
create unique index if not exists profiles_email_lower_key on public.profiles (lower(email));

-- The route guard resolves portal + role on every gated request.
create index if not exists profiles_portal_idx  on public.profiles (portal);
create index if not exists profiles_role_id_idx on public.profiles (role_id);
-- Partial index: almost every lookup filters to active users.
create index if not exists profiles_active_idx  on public.profiles (id) where is_active;

-- ------------------------------------------------------- policy helpers ----
-- SECURITY DEFINER so the policies below can read `profiles` without
-- re-entering `profiles` RLS, which would recurse infinitely.

create or replace function private.current_portal()
returns public.portal language sql stable security definer set search_path = '' as $$
  select p.portal from public.profiles p where p.id = (select auth.uid());
$$;

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.portal = 'ADMIN' and p.is_active
       from public.profiles p
      where p.id = (select auth.uid())),
    false
  );
$$;

create or replace function private.current_role_id()
returns text language sql stable security definer set search_path = '' as $$
  select p.role_id from public.profiles p where p.id = (select auth.uid());
$$;

-- ------------------------------------------------------ trigger helpers ----

create or replace function private.set_updated_at()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Provision a profile the moment Supabase Auth creates the user, so there is
-- never a window where a session exists without an identity to resolve.
--
-- `portal` and `role_id` are deliberately NOT read from raw_user_meta_data:
-- that payload is attacker-controlled on a public signup endpoint. Every
-- self-signup starts as CLIENT with no role; elevation is an admin action.
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name, portal, role_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'CLIENT',
    null
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Without this, a plain "users may update their own profile" policy lets any
-- account promote itself to ADMIN.
create or replace function private.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if (new.portal is distinct from old.portal
      or new.role_id is distinct from old.role_id
      or new.is_active is distinct from old.is_active)
     and not private.is_admin()
  then
    raise exception
      'portal, role_id and is_active may only be changed by an administrator'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------- function grants ----
-- Trigger functions run as the trigger owner; no API role needs EXECUTE.
revoke all on function private.set_updated_at()           from public, anon, authenticated;
revoke all on function private.handle_new_user()          from public, anon, authenticated;
revoke all on function private.guard_profile_privileges() from public, anon, authenticated;

-- Policy helpers: anon evaluates none of these policies, so it needs nothing.
revoke all on function private.current_portal()  from public, anon;
revoke all on function private.current_role_id() from public, anon;
revoke all on function private.is_admin()        from public, anon;
grant execute on function private.current_portal()  to authenticated;
grant execute on function private.current_role_id() to authenticated;
grant execute on function private.is_admin()        to authenticated;

-- ------------------------------------------------------------- triggers ----

drop trigger if exists profiles_set_updated_at   on public.profiles;
drop trigger if exists profiles_guard_privileges on public.profiles;
drop trigger if exists on_auth_user_created      on auth.users;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

create trigger profiles_guard_privileges
  before update on public.profiles
  for each row execute function private.guard_profile_privileges();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ------------------------------------------------------------------ RLS ----

alter table public.profiles enable row level security;
alter table public.roles    enable row level security;

drop policy if exists profiles_select_own      on public.profiles;
drop policy if exists profiles_select_admin    on public.profiles;
drop policy if exists profiles_update_own      on public.profiles;
drop policy if exists profiles_update_admin    on public.profiles;
drop policy if exists roles_select_authenticated on public.roles;
drop policy if exists roles_write_admin        on public.roles;

-- Wrapping auth.uid() in a scalar subquery lets the planner evaluate it once
-- per statement instead of once per row.

create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_select_admin on public.profiles
  for select to authenticated
  using (private.is_admin());

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy profiles_update_admin on public.profiles
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- No INSERT policy: rows arrive only via the on_auth_user_created trigger.
-- No DELETE policy: profiles are removed by cascade when the auth user is.

-- Roles are readable by any signed-in user (the UI labels grants with them);
-- only admins may modify them.
create policy roles_select_authenticated on public.roles
  for select to authenticated
  using (true);

create policy roles_write_admin on public.roles
  for all to authenticated
  using (private.is_admin())
  with check (private.is_admin());

-- Now that private.is_admin() exists, attach the registry's read policy.
drop policy if exists schema_migrations_select_admin on public.schema_migrations;
create policy schema_migrations_select_admin on public.schema_migrations
  for select to authenticated
  using (private.is_admin());

-- -------------------------------------------------------------- realtime ---
-- Profile changes drive presence and the route guard, so they are published.
-- `roles` changes rarely and is fetched on demand.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'profiles'
  ) then
    alter publication supabase_realtime add table public.profiles;
  end if;
end $$;

-- ------------------------------------------------------------------ seed ---
-- The four system roles, migrated out of lib/access-control.ts. Reference
-- data, not demo data: the FK on profiles.role_id requires them and the route
-- guard resolves against them.

insert into public.roles (id, name, description, is_system) values
  ('senior-specialist', 'Senior Specialist',
   'Delivery ICs — own their service line, no financial reach.', true),
  ('project-lead',      'Project Lead',
   'Accountable for engagements, staffing and client comms.',    true),
  ('financial-auditor', 'Financial Auditor',
   'Read-only across the business, write access to ledgers.',    true),
  ('global-admin',      'Global Admin',
   'Unrestricted. Every grant is logged to the audit trail.',    true)
on conflict (id) do nothing;

-- ------------------------------------------- supersede the public helpers ---
-- Earlier revisions created these in `public`, where PostgREST exposed them as
-- RPC endpoints. Dropped if a previous run left them behind.

drop function if exists public.current_portal();
drop function if exists public.current_role_id();
drop function if exists public.is_admin();
drop function if exists public.set_updated_at();
drop function if exists public.handle_new_user();
drop function if exists public.guard_profile_privileges();

-- Pre-existing Supabase safety net (auto-enables RLS on new public tables).
-- Left in place; only its needless API exposure is removed.
do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.proname = 'rls_auto_enable'
  ) then
    revoke all on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;

select private.record_migration('0001', 'authentication');
