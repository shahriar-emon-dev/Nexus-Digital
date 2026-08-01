-- =============================================================================
-- 0011_fix_admin_privilege_conflation.sql
--
-- SECURITY FIX. Privilege escalation present since 0001.
--
-- `private.is_admin()` returned true for ANY profile whose portal is 'ADMIN',
-- ignoring the role entirely. Portal and privilege are different things:
-- portal decides which surface a person sees, role decides what they may do.
-- Conflating them meant every policy written as `using (private.is_admin())`
-- — profiles, roles, role_grants, organizations, projects, security_policies,
-- media — was gated on *being on the admin portal* rather than on holding
-- administrative permission.
--
-- Demonstrated with a financial-auditor on the ADMIN portal, a role whose
-- grant on security-policies is 'audit':
--
--   route guard  -> correctly refused /admin/keys
--   database     -> rewrote its OWN grant to 'full'
--   database     -> promoted another user to ADMIN
--   database     -> read the IP allow-list
--
-- The UI reported the restriction while the API ignored it, which is worse
-- than an obvious hole because the screen looks correct.
--
-- Administrative privilege now requires BOTH the admin portal AND a grant of
-- at least 'admin' on `security-policies`, which is the module that already
-- governs the access-control console and key management.
--
-- Deliberate consequence: a profile on the ADMIN portal with no role, or with
-- a role that lacks that grant, is no longer an administrator. Deny-by-default
-- is right here, but it means an operator can lock every human out by clearing
-- roles. The escape hatch is unchanged and intentional — `auth.uid()` is NULL
-- for the service role and for SQL run from the dashboard, and 0002 already
-- treats a NULL caller as a trusted server context, so recovery is always
-- possible from the SQL editor.
--
-- SAFE TO RE-RUN. Requires 0007_roles_and_permissions.sql.
-- =============================================================================

create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select coalesce(
    (
      select p.portal = 'ADMIN'
         and p.is_active
         and exists (
           select 1
             from public.role_grants g
            where g.role_id   = p.role_id
              and g.module_id = 'security-policies'
              -- access_level is declared in ascending privilege order, so this
              -- comparison is the whole check.
              and g.level    >= 'admin'
         )
        from public.profiles p
       where p.id = (select auth.uid())
    ),
    false
  );
$$;

comment on function private.is_admin() is
  'True only for an active ADMIN-portal profile whose role holds admin or '
  'higher on security-policies. Portal alone is NOT privilege.';

revoke all on function private.is_admin() from public, anon;
grant execute on function private.is_admin() to authenticated;

select private.record_migration('0011', 'fix_admin_privilege_conflation');
