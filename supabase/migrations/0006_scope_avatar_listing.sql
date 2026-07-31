-- =============================================================================
-- 0006_scope_avatar_listing.sql
--
-- Stops the avatars bucket being enumerable.
--
-- 0004 created a broad `for select ... using (bucket_id = 'avatars')` policy.
-- Rendering an avatar never needed it: a public bucket serves objects through
-- /storage/v1/object/public/<bucket>/<path>, which does not consult RLS. What
-- the policy actually granted was `list()` — any client could enumerate every
-- avatar path in the bucket, and those paths are user ids.
--
-- A SELECT policy is still required for one real case: removeMyAvatar() lists
-- the caller's own folder to delete previous uploads. So the policy is kept but
-- narrowed to that folder, exactly like the write policies.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

drop policy if exists avatars_read     on storage.objects;
drop policy if exists avatars_list_own on storage.objects;

-- Listing is confined to the caller's own prefix. Public URL reads are
-- unaffected and need no policy at all.
create policy avatars_list_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

select private.record_migration('0006', 'scope_avatar_listing');
