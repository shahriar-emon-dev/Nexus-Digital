-- =============================================================================
-- 0005_guard_organization_membership.sql
--
-- Closes a cross-tenant hole opened by 0004.
--
-- The privilege guard introduced in 0001 protects portal, role_id and
-- is_active. 0004 added `profiles.organization_id` but did not extend the
-- guard, so the "users may update their own profile" policy let any account
-- rewrite its own organisation membership.
--
-- That is not a cosmetic field. `organizations_select` grants read access via
-- `id = private.current_org_id()`, so a user could point themselves at any
-- organisation and read it. Every table scoped by organisation from here on —
-- projects, invoices, messages, deliverables — would inherit the same hole.
--
-- Org membership is an administrative assignment, exactly like portal and role.
--
-- Caught by supabase/verify/profiles_security_check.sql, checks 10 and 11.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

create or replace function private.guard_profile_privileges()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := (select auth.uid());
begin
  if (new.portal          is distinct from old.portal
      or new.role_id         is distinct from old.role_id
      or new.is_active       is distinct from old.is_active
      or new.organization_id is distinct from old.organization_id)
  then
    -- caller IS NULL  -> service role, superuser or migration: already past RLS.
    -- caller NOT NULL -> an end user, who must hold ADMIN to reassign these.
    if caller is not null and not private.is_admin() then
      raise exception
        'portal, role_id, is_active and organization_id may only be changed by an administrator'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function private.guard_profile_privileges() from public, anon, authenticated;

select private.record_migration('0005', 'guard_organization_membership');
