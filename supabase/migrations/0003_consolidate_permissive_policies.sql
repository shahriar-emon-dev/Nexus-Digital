-- =============================================================================
-- 0003_consolidate_permissive_policies.sql
--
-- Merges overlapping permissive RLS policies.
--
-- Postgres evaluates EVERY permissive policy for a role/action pair on EVERY
-- row, then ORs the results. 0001 split ownership and admin access into
-- separate policies, which reads well but doubles the per-row cost of the
-- hottest queries in the app: `profiles` is read on every gated request.
--
-- One policy per role/action, with the OR written explicitly, is the same
-- logic at half the evaluations.
--
--   profiles SELECT : profiles_select_own   + profiles_select_admin   -> 1
--   profiles UPDATE : profiles_update_own   + profiles_update_admin   -> 1
--   roles    SELECT : roles_select_authenticated + roles_write_admin  -> 1
--
-- `roles_write_admin` was declared FOR ALL, which silently includes SELECT and
-- so stacked a second policy on top of the intended read policy. It is now
-- scoped to the write actions only.
--
-- No behavioural change. Verified by supabase/verify/auth_security_check.sql,
-- which must still report 22/22 after this runs. Four of those checks exist
-- specifically for this migration: merging policies with OR is how access gets
-- widened by accident, so cross-row writes are asserted against disk.
--
-- SAFE TO RE-RUN. Requires 0001_authentication.sql.
-- =============================================================================

-- -------------------------------------------------------------- profiles ----

drop policy if exists profiles_select_own   on public.profiles;
drop policy if exists profiles_select_admin on public.profiles;
drop policy if exists profiles_select       on public.profiles;

create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
  );

drop policy if exists profiles_update_own   on public.profiles;
drop policy if exists profiles_update_admin on public.profiles;
drop policy if exists profiles_update       on public.profiles;

-- The privilege guard trigger still governs portal, role_id and is_active, so
-- widening the row filter here does not widen what a non-admin may change.
create policy profiles_update on public.profiles
  for update to authenticated
  using (
    id = (select auth.uid())
    or private.is_admin()
  )
  with check (
    id = (select auth.uid())
    or private.is_admin()
  );

-- ----------------------------------------------------------------- roles ----

drop policy if exists roles_select_authenticated on public.roles;
drop policy if exists roles_write_admin          on public.roles;
drop policy if exists roles_insert_admin         on public.roles;
drop policy if exists roles_update_admin         on public.roles;
drop policy if exists roles_delete_admin         on public.roles;

-- Any signed-in user may read roles: the UI labels grants with them.
create policy roles_select_authenticated on public.roles
  for select to authenticated
  using (true);

-- Writes are admin-only, split by action so none of them overlaps the read
-- policy above.
create policy roles_insert_admin on public.roles
  for insert to authenticated
  with check (private.is_admin());

create policy roles_update_admin on public.roles
  for update to authenticated
  using (private.is_admin())
  with check (private.is_admin());

create policy roles_delete_admin on public.roles
  for delete to authenticated
  using (private.is_admin());

select private.record_migration('0003', 'consolidate_permissive_policies');
