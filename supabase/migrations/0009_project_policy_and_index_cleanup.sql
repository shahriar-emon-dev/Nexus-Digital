-- =============================================================================
-- 0009_project_policy_and_index_cleanup.sql
--
-- Two classes of defect the advisors caught in 0008, one of them a repeat.
--
-- 1. FOR ALL includes SELECT. `project_milestones_write_admin` and
--    `project_tasks_write_staff` were declared FOR ALL, which stacks a second
--    permissive policy on the read path — the exact mistake 0003 fixed on
--    `roles`. Postgres evaluates every permissive policy on every row, so the
--    board and roadmap were paying twice per row to reach the same answer.
--    Writes are now split per action, leaving SELECT to the read policy alone.
--
-- 2. Foreign keys without a covering index. Postgres does not index the
--    referencing side automatically, so every delete of a profile or module
--    had to scan the referencing table to enforce the constraint.
--
-- SAFE TO RE-RUN. Requires 0008_projects.sql.
-- =============================================================================

-- ------------------------------------------------- milestones: split write --

drop policy if exists project_milestones_write_admin  on public.project_milestones;
drop policy if exists project_milestones_insert_admin on public.project_milestones;
drop policy if exists project_milestones_update_admin on public.project_milestones;
drop policy if exists project_milestones_delete_admin on public.project_milestones;

create policy project_milestones_insert_admin on public.project_milestones
  for insert to authenticated with check (private.is_admin());
create policy project_milestones_update_admin on public.project_milestones
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy project_milestones_delete_admin on public.project_milestones
  for delete to authenticated using (private.is_admin());

-- ------------------------------------------------------ tasks: split write --

drop policy if exists project_tasks_write_staff  on public.project_tasks;
drop policy if exists project_tasks_insert_staff on public.project_tasks;
drop policy if exists project_tasks_update_staff on public.project_tasks;
drop policy if exists project_tasks_delete_staff on public.project_tasks;

create policy project_tasks_insert_staff on public.project_tasks
  for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');
create policy project_tasks_update_staff on public.project_tasks
  for update to authenticated
  using (private.is_admin() or private.current_portal() = 'STAFF')
  with check (private.is_admin() or private.current_portal() = 'STAFF');
create policy project_tasks_delete_staff on public.project_tasks
  for delete to authenticated
  using (private.is_admin() or private.current_portal() = 'STAFF');

-- ------------------------------------------------ covering FK indexes ------

create index if not exists project_milestones_lead_idx
  on public.project_milestones (lead_id);
create index if not exists project_tasks_assignee_idx
  on public.project_tasks (assignee_id);
create index if not exists isolation_policies_module_idx
  on public.isolation_policies (module_id);
create index if not exists security_policies_updated_by_idx
  on public.security_policies (updated_by);

select private.record_migration('0009', 'project_policy_and_index_cleanup');
