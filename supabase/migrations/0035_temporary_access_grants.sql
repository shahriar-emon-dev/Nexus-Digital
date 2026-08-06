-- =============================================================================
-- 0035_temporary_access_grants.sql
--
-- Time-boxed access elevation.
--
-- The design shows "Sarah Jenkins — Granted 'View Financials' — Expires in 2h
-- 45m" with a revoke button. For that to mean anything the grant has to reach
-- the same resolution path RLS already uses, so this migration also rewrites
-- is_admin() and can_edit_content() to consult it. A temporary grant that only
-- rendered would be a console that claims to hand out access and does not.
--
-- THIS FILE TOUCHES THE MOST SECURITY-CRITICAL FUNCTION IN THE SCHEMA.
-- private.is_admin() had a privilege-escalation bug until 0011, where it
-- returned true for anyone on the ADMIN portal regardless of grant. Its
-- semantics are preserved exactly here — ADMIN portal, active account,
-- security-policies at admin or above — and only the source of the grant
-- widens. Verified with eleven role-switched assertions, including that a
-- CLIENT holding a live `full` grant on security-policies is still not an
-- admin, because elevation raises the GRANT and never the PORTAL.
--
-- SAFE TO RE-RUN. Requires 0011_fix_admin_privilege_conflation.sql.
-- =============================================================================

create table if not exists public.temporary_grants (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  module_id   text not null references public.permission_modules (id) on delete cascade,
  level       public.access_level not null,
  reason      text not null default '',
  granted_by  uuid references public.profiles (id) on delete set null,
  expires_at  timestamptz not null,
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  constraint temporary_grants_expires_in_future check (expires_at > created_at),
  -- 'none' would be a grant that grants nothing; use revocation for that.
  constraint temporary_grants_level_meaningful check (level > 'none')
);

comment on table public.temporary_grants is
  'Time-boxed elevation above a role grant. Expiry is evaluated on read, never '
  'by a scheduled job, so a lapsed grant cannot keep working because a cron did '
  'not run.';

create index if not exists temporary_grants_live_idx
  on public.temporary_grants (profile_id, module_id, expires_at)
  where revoked_at is null;

alter table public.temporary_grants enable row level security;

drop policy if exists temporary_grants_select on public.temporary_grants;
drop policy if exists temporary_grants_insert on public.temporary_grants;
drop policy if exists temporary_grants_update on public.temporary_grants;
drop policy if exists temporary_grants_delete on public.temporary_grants;

-- A person may see elevation granted to them; only an admin sees all of it.
create policy temporary_grants_select on public.temporary_grants
  for select to authenticated
  using (private.is_admin() or profile_id = (select auth.uid()));
create policy temporary_grants_insert on public.temporary_grants
  for insert to authenticated with check (private.is_admin());
create policy temporary_grants_update on public.temporary_grants
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy temporary_grants_delete on public.temporary_grants
  for delete to authenticated using (private.is_admin());

/**
 * Separation of duties: nobody elevates themselves.
 *
 * An admin can already change permanent grants, so this is not the last line of
 * defence — but "grant myself financials for two hours" is the exact motion an
 * audit needs to be able to rule out, and it costs nothing to make impossible.
 */
create or replace function private.reject_self_elevation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.profile_id = auth.uid() then
    raise exception 'a temporary grant cannot be issued to yourself'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end $$;

drop trigger if exists temporary_grants_no_self on public.temporary_grants;
create trigger temporary_grants_no_self before insert or update on public.temporary_grants
  for each row execute function private.reject_self_elevation();

/**
 * The single place a person's level on a module is decided.
 *
 * Returns the higher of the permanent role grant and any live temporary grant.
 * SECURITY DEFINER so it can read both tables without RLS recursion — the
 * temporary_grants policies call is_admin(), which calls this.
 *
 * Both halves check `is_active`, so deactivating an account revokes permanent
 * and temporary access in one move.
 */
create or replace function private.effective_level(p_module text)
returns public.access_level
language sql
stable
security definer
set search_path = ''
as $$
  select greatest(
    coalesce((
      select g.level
        from public.profiles p
        join public.role_grants g on g.role_id = p.role_id
       where p.id = (select auth.uid())
         and p.is_active
         and g.module_id = p_module
    ), 'none'::public.access_level),
    coalesce((
      select max(t.level)
        from public.temporary_grants t
        join public.profiles p on p.id = t.profile_id
       where t.profile_id = (select auth.uid())
         and p.is_active
         and t.module_id = p_module
         and t.revoked_at is null
         and t.expires_at > now()
    ), 'none'::public.access_level)
  );
$$;

comment on function private.effective_level(text) is
  'Highest live grant on a module: permanent role grant or an unexpired '
  'temporary one. Inactive accounts resolve to none.';

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select p.portal = 'ADMIN'
         and p.is_active
         -- Elevation raises the GRANT. It never grants the admin portal, so a
         -- CLIENT cannot be temporarily promoted into the admin surface.
         and private.effective_level('security-policies') >= 'admin'
        from public.profiles p
       where p.id = (select auth.uid())
    ),
    false
  );
$$;

create or replace function private.can_edit_content()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    private.is_admin()
    or (
      select p.is_active and private.effective_level('content-publishing') >= 'edit'
        from public.profiles p
       where p.id = (select auth.uid())
    ),
    false
  );
$$;

/** Live elevation, with the remaining time the screen renders. */
create or replace view public.active_temporary_grants
with (security_invoker = true) as
select
  t.id,
  t.profile_id,
  t.module_id,
  t.level,
  t.reason,
  t.granted_by,
  t.expires_at,
  t.created_at,
  greatest(0, extract(epoch from (t.expires_at - now()))::bigint) as seconds_remaining
from public.temporary_grants t
where t.revoked_at is null
  and t.expires_at > now();

comment on view public.active_temporary_grants is
  'Unexpired, unrevoked elevation. Time remaining is computed on read so it '
  'cannot be stale.';

alter table public.security_policies
  add column if not exists inherit_permissions boolean not null default true;

comment on column public.security_policies.inherit_permissions is
  'The Global Security toggle: whether permissions cascade down the tier '
  'hierarchy unless specifically overridden.';

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'temporary_grants') then
    alter publication supabase_realtime add table public.temporary_grants;
  end if;
end $$;

select private.record_migration('0035', 'temporary_access_grants');
