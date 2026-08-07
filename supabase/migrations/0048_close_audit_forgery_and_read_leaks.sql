-- =============================================================================
-- 0048_close_audit_forgery_and_read_leaks.sql
--
-- Four findings from the production-readiness audit, all of the same shape: a
-- policy that was written permissively during the build and never tightened.
--
-- SAFE TO RE-RUN. Requires 0022 (audit), 0028 (service_details), 0034 (roles).
-- =============================================================================

-- SEC-01 — audit-log forgery ---------------------------------------------------
--
-- The trail was immutable against UPDATE, DELETE and TRUNCATE, and wide open to
-- INSERT: `WITH CHECK (true)` for every authenticated user, with table INSERT
-- granted and public.audit_log published through PostgREST. Any client or staff
-- account could POST entries attributed to an administrator — and because the
-- table is immutable by design, a forged row could never be removed again.
--
-- Nothing in the application inserts here. Every genuine entry comes from a
-- trigger calling private.write_audit, which is SECURITY DEFINER and pins
-- actor_id to auth.uid(). Direct INSERT was therefore pure attack surface.
--
-- Verified after applying: write_audit still succeeds through the definer path.

drop policy if exists audit_log_insert on public.audit_log;
revoke insert on public.audit_log from anon, authenticated;

create or replace function private.reject_audit_insert()
returns trigger language plpgsql as $$
begin
  raise exception 'audit_log accepts writes only through private.write_audit'
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists audit_log_no_direct_insert on public.audit_log;
create trigger audit_log_no_direct_insert
  before insert on public.audit_log
  for each row
  -- write_audit is SECURITY DEFINER owned by postgres, so inside it current_user
  -- is the owner and this never fires. Everyone else is refused. This sits
  -- behind the revoked grant deliberately: a future GRANT cannot silently
  -- reopen the hole without also dropping this trigger.
  when (current_user <> 'postgres' and pg_has_role(current_user, 'postgres', 'member') = false)
  execute function private.reject_audit_insert();

-- SEC-02 — unpublished service pricing ----------------------------------------
--
-- The service PAGES for drafts and the archived service correctly 404. Their
-- catalogue metadata did not: `USING (true)` for anon meant price, lead time,
-- category and summary for all nine services were readable straight off
-- /rest/v1/service_details while only five were published.
--
-- Mirrors the pages policy exactly, including the detail that publication is
-- decided by the publish pointer and not by status alone.

drop policy if exists service_details_select_public on public.service_details;

create policy service_details_select_public on public.service_details
  for select to anon
  using (exists (
    select 1 from public.pages p
    where p.id = service_details.page_id
      and p.status = 'published'
      and p.published_version_id is not null));

create policy service_details_select_editor on public.service_details
  for select to authenticated
  using (
    private.can_edit_content()
    or private.is_admin()
    or exists (
      select 1 from public.pages p
      where p.id = service_details.page_id
        and p.status = 'published'
        and p.published_version_id is not null));

-- SEC-03 — media library -------------------------------------------------------
--
-- media_assets was anon-readable with `USING (true)`, making the whole library
-- enumerable including PDFs. Nothing public reads it: the library is an admin
-- surface and published pages carry their asset URLs inside the block JSON.

drop policy if exists media_assets_select on public.media_assets;

create policy media_assets_select on public.media_assets
  for select to authenticated
  using (private.can_edit_content() or private.is_admin());

-- SVG can carry script, and the media bucket is public — so an uploaded SVG is
-- a stored-XSS and phishing vector served from a domain the agency owns.
update storage.buckets
   set allowed_mime_types = array_remove(allowed_mime_types, 'image/svg+xml')
 where id = 'media';

-- SEC-04 — permission matrix ---------------------------------------------------
--
-- roles, role_grants, capabilities and permission_modules were all readable by
-- every authenticated account, handing any client a complete map of the
-- authorisation model to probe against. A user's own grants are resolved inside
-- SECURITY DEFINER helpers, not by selecting these tables, so restricting them
-- costs the application nothing.

drop policy if exists role_grants_select on public.role_grants;
create policy role_grants_select on public.role_grants
  for select to authenticated
  using (private.is_admin() or role_id = private.current_role_id());

drop policy if exists roles_select_authenticated on public.roles;
create policy roles_select_authenticated on public.roles
  for select to authenticated
  using (private.is_admin() or id = private.current_role_id());

drop policy if exists capabilities_select on public.capabilities;
create policy capabilities_select on public.capabilities
  for select to authenticated
  using (private.is_admin());

drop policy if exists permission_modules_select on public.permission_modules;
create policy permission_modules_select on public.permission_modules
  for select to authenticated
  using (private.is_admin());

select private.record_migration('0048', 'close_audit_forgery_and_read_leaks');
