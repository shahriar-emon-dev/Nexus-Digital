-- =============================================================================
-- 0013_freeze_content_not_columns.sql
--
-- Fixes the immutability trigger added in 0012.
--
-- `freeze_published_version` rejected ANY update to a frozen version. But
-- `page_versions.created_by` is a foreign key declared ON DELETE SET NULL, and
-- that cascade is implemented as an UPDATE — so deleting a profile that had
-- ever published a page raised "published versions are immutable" and the
-- delete failed outright. An editor leaving the company would have been
-- undeletable.
--
-- Immutability is a property of the CONTENT, not of every column. The trigger
-- now fires only when blocks, seo or is_draft actually change, which is what
-- history integrity depends on; bookkeeping columns are left alone.
--
-- SAFE TO RE-RUN. Requires 0012_pages_and_versions.sql.
-- =============================================================================

create or replace function private.freeze_published_version()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.is_draft = false
     and (select auth.uid()) is not null
     and (new.blocks   is distinct from old.blocks
       or new.seo      is distinct from old.seo
       or new.is_draft is distinct from old.is_draft)
  then
    raise exception 'published versions are immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke all on function private.freeze_published_version() from public, anon, authenticated;

select private.record_migration('0013', 'freeze_content_not_columns');
