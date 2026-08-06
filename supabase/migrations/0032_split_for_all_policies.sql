-- =============================================================================
-- 0032_split_for_all_policies.sql
--
-- Splits `FOR ALL` policies into the three write commands.
--
-- A `FOR ALL` policy also covers SELECT, so every table below evaluated two
-- permissive SELECT policies on every read — the dedicated select policy and
-- the write policy's USING clause. Postgres ORs them, so the result was
-- correct but the second predicate ran for nothing on every row, and each of
-- those predicates calls private.is_admin(), which itself queries profiles.
--
-- This repeats the fix migration 0003 applied to the original tables. The
-- tables added in 0022-0028 reintroduced the pattern, which is a good argument
-- for `FOR ALL` never being the right default here.
--
-- SAFE TO RE-RUN. Requires 0022, 0024, 0027 and 0028.
-- =============================================================================

-- ------------------------------------------------------------ credentials --
drop policy if exists api_credentials_write  on public.api_credentials;
drop policy if exists api_credentials_insert on public.api_credentials;
drop policy if exists api_credentials_update on public.api_credentials;
drop policy if exists api_credentials_delete on public.api_credentials;

create policy api_credentials_insert on public.api_credentials
  for insert to authenticated with check (private.is_admin());
create policy api_credentials_update on public.api_credentials
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy api_credentials_delete on public.api_credentials
  for delete to authenticated using (private.is_admin());

-- -------------------------------------------------------- keyword rankings --
drop policy if exists keyword_rankings_write  on public.keyword_rankings;
drop policy if exists keyword_rankings_insert on public.keyword_rankings;
drop policy if exists keyword_rankings_update on public.keyword_rankings;
drop policy if exists keyword_rankings_delete on public.keyword_rankings;

create policy keyword_rankings_insert on public.keyword_rankings
  for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());
create policy keyword_rankings_update on public.keyword_rankings
  for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());
create policy keyword_rankings_delete on public.keyword_rankings
  for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

-- ------------------------------------------------------------ seo keywords --
drop policy if exists seo_keywords_write  on public.seo_keywords;
drop policy if exists seo_keywords_insert on public.seo_keywords;
drop policy if exists seo_keywords_update on public.seo_keywords;
drop policy if exists seo_keywords_delete on public.seo_keywords;

create policy seo_keywords_insert on public.seo_keywords
  for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());
create policy seo_keywords_update on public.seo_keywords
  for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());
create policy seo_keywords_delete on public.seo_keywords
  for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

-- ------------------------------------------------------ project assignments --
drop policy if exists project_assignments_write  on public.project_assignments;
drop policy if exists project_assignments_insert on public.project_assignments;
drop policy if exists project_assignments_update on public.project_assignments;
drop policy if exists project_assignments_delete on public.project_assignments;

create policy project_assignments_insert on public.project_assignments
  for insert to authenticated with check (private.is_admin());
create policy project_assignments_update on public.project_assignments
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy project_assignments_delete on public.project_assignments
  for delete to authenticated using (private.is_admin());

-- ---------------------------------------------------------- service details --
drop policy if exists service_details_write  on public.service_details;
drop policy if exists service_details_insert on public.service_details;
drop policy if exists service_details_update on public.service_details;
drop policy if exists service_details_delete on public.service_details;

create policy service_details_insert on public.service_details
  for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());
create policy service_details_update on public.service_details
  for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());
create policy service_details_delete on public.service_details
  for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

-- ------------------------------------------------------------------ reviews --
-- Two SELECT policies here were deliberate but redundant: the staff predicate
-- is a superset of the public one for any authenticated caller, so they merge
-- into a single policy without changing who sees what. Anon keeps its own.
--
-- Verified after the change by switching role: anon still sees an approved
-- review and still cannot see a pending one.
drop policy if exists reviews_select_public on public.reviews;
drop policy if exists reviews_select_staff  on public.reviews;
drop policy if exists reviews_select_anon   on public.reviews;
drop policy if exists reviews_select_authed on public.reviews;

create policy reviews_select_anon on public.reviews
  for select to anon using (status = 'approved');
create policy reviews_select_authed on public.reviews
  for select to authenticated
  using (status = 'approved' or private.can_edit_content() or private.is_admin());

-- ------------------------------------------------------ covering FK indexes --
create index if not exists api_credentials_owner_idx   on public.api_credentials (owner_id);
create index if not exists api_credentials_creator_idx on public.api_credentials (created_by);
create index if not exists reviews_author_idx          on public.reviews (author_id);
create index if not exists reviews_moderator_idx       on public.reviews (moderated_by);
create index if not exists seo_keywords_creator_idx    on public.seo_keywords (created_by);

select private.record_migration('0032', 'split_for_all_policies');
