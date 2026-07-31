-- =============================================================================
-- 0002_fix_privilege_guard_server_context.sql
--
-- Fixes a bug in the 0001 privilege guard.
--
-- `private.guard_profile_privileges()` rejected every change to portal,
-- role_id and is_active unless `private.is_admin()` returned true. But
-- `is_admin()` resolves the caller through `auth.uid()`, which is NULL outside
-- an end-user request — a direct `postgres` connection, a service-role key, a
-- migration, a scheduled job. So the guard blocked exactly the trusted
-- server-side paths that need to assign roles, including provisioning the
-- first administrator.
--
-- A NULL `auth.uid()` is safe to treat as a trusted context here because RLS is
-- the outer gate: `anon` has no UPDATE policy on `profiles` at all, and every
-- `authenticated` request carries a uid. Reaching this trigger with no uid
-- therefore means the caller already bypassed RLS, which only the service role
-- and superusers can do.
--
-- SAFE TO RE-RUN. Requires 0001_authentication.sql.
-- =============================================================================

create or replace function private.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := (select auth.uid());
begin
  if (new.portal    is distinct from old.portal
      or new.role_id   is distinct from old.role_id
      or new.is_active is distinct from old.is_active)
  then
    -- caller IS NULL  -> service role, superuser or migration: already past RLS.
    -- caller NOT NULL -> an end user, who must hold ADMIN to reassign these.
    if caller is not null and not private.is_admin() then
      raise exception
        'portal, role_id and is_active may only be changed by an administrator'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_privileges() from public, anon, authenticated;

select private.record_migration('0002', 'fix_privilege_guard_server_context');
