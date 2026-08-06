-- =============================================================================
-- 0031_public_staff_invoker_view.sql
--
-- Makes public_staff a SECURITY INVOKER view.
--
-- It was SECURITY DEFINER because the About page renders as `anon`, and
-- `profiles` had no anon policy — so joining to it returned null names and the
-- roster silently rendered empty. Elevating the whole view fixed the symptom
-- and is an ERROR-level lint, because a definer view enforces the CREATOR's
-- permissions for every caller.
--
-- The precise fix is two narrow grants instead of one broad one:
--
--   1. An RLS policy letting anon see a profile row ONLY when that person has
--      a staff_profile marked public.
--   2. Column-level SELECT on exactly the three columns the roster renders.
--
-- Table-level SELECT is revoked from anon first, so the column grant is the
-- whole of anon's access. Email, phone, organisation and role stay unreadable
-- even for a published staff member — the policy decides WHICH rows, the
-- column grant decides WHICH fields, and anon needs both to see anything.
--
-- Verified by switching role: `select *` on profiles is denied outright,
-- organization_id and role_id are denied, and the granted columns reach only
-- the published staff rows (2 of 3 profiles at the time of writing).
--
-- SAFE TO RE-RUN. Requires 0020_public_staff_view.sql.
-- =============================================================================

revoke select on public.profiles from anon;
grant select (id, full_name, avatar_url) on public.profiles to anon;

drop policy if exists profiles_select_public_staff on public.profiles;
create policy profiles_select_public_staff on public.profiles
  for select to anon
  using (
    exists (
      select 1 from public.staff_profiles s
       where s.id = profiles.id
         and s.is_public
    )
  );

create or replace view public.public_staff
with (security_invoker = true) as
select
  s.id,
  s.slug,
  s.display_role,
  s.department,
  s.skills,
  s.display_order,
  p.full_name,
  p.avatar_url
from public.staff_profiles s
join public.profiles p on p.id = s.id
where s.is_public;

comment on view public.public_staff is
  'Public roster projection. SECURITY INVOKER: anon reaches it through a row '
  'policy scoped to published staff plus a column grant covering only name '
  'and avatar.';

select private.record_migration('0031', 'public_staff_invoker_view');
