-- =============================================================================
-- 0020_public_staff_view.sql
--
-- The public roster could not render.
--
-- listPublicStaff joined staff_profiles to profiles for the name and avatar,
-- but the About page renders server-side with the ANON key and `profiles` has
-- no anon policy — correctly, because it holds email addresses. The join
-- returned null, the row was dropped, and the page silently fell back to the
-- built-in roster. A missing name is exactly the kind of failure that looks
-- like "the feature is not wired" rather than "RLS did its job".
--
-- This view exposes only the columns a public roster needs. It is SECURITY
-- DEFINER on purpose: a public projection over a protected table is what that
-- is for, and the column list is the protection. No email, portal, role or
-- organisation is exposed.
--
-- SAFE TO RE-RUN. Requires 0019_staff_directory.sql.
-- =============================================================================

create or replace view public.public_staff
with (security_invoker = false) as
  select
    sp.id,
    sp.slug,
    sp.display_role,
    sp.department,
    sp.skills,
    sp.display_order,
    p.full_name,
    p.avatar_url
  from public.staff_profiles sp
  join public.profiles p on p.id = sp.id
 where sp.is_public
   and p.is_active;

comment on view public.public_staff is
  'Public projection of the staff roster. SECURITY DEFINER so it can read '
  'profiles, which anon must not query directly; the column list is what makes '
  'that safe — no email, portal, role or organisation is exposed.';

revoke all on public.public_staff from public;
grant select on public.public_staff to anon, authenticated;

select private.record_migration('0020', 'public_staff_view');
