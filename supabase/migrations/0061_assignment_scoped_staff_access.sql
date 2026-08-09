-- =============================================================================
-- 0061_assignment_scoped_staff_access.sql
--
-- Staff visibility becomes assignment-scoped instead of portal-scoped.
--
-- `private.can_see_project()` and `projects_select` both ended in
-- `private.current_portal() = 'STAFF'`, which meant EVERY staff member could
-- read EVERY project — and, because can_see_project also gates project_files,
-- deliverables, milestones, tasks, meetings and time entries, every artefact
-- attached to them. The specification (§9.3) requires the opposite: a
-- Specialist sees only their assigned projects, and a Contractor sees less
-- than that.
--
-- The rule implemented here:
--
--   admin                                   -> every project
--   the client organisation that owns it    -> its own projects
--   the project's own lead_id               -> that project
--   a staff member ASSIGNED to it           -> that project
--   a staff member whose role tier >= 3     -> every project
--
-- Tier 3 is `Project Lead` and above (roles.level). A lead genuinely needs
-- portfolio-wide visibility to reassign work; a specialist does not. The tier
-- is read from `public.roles.level` rather than hardcoded here, so promoting
-- somebody in the admin console changes what they can see with no deploy.
--
-- SEEDING: `project_assignments` is empty in this database, so applying the
-- predicate alone would remove the existing Senior Specialist's access to both
-- live projects and make the staff portal look broken. Every STAFF profile is
-- therefore assigned to every existing project ONCE, at the bottom of this
-- file, preserving today's effective access exactly. New projects get no
-- implicit assignment — that is the point of the change.
--
-- Also in this migration:
--   * project_milestones joins the realtime publication (the client Milestone
--     Roadmap and the "Next Milestone" KPI could not update live).
--   * project_milestones gains write policies for content-capable leads rather
--     than admin-only, so milestone CRUD is reachable from the staff portal.
--   * private.in_channel() wraps auth.uid() in a scalar subquery, the same fix
--     0054 applied to policy predicates and missed inside this function.
--
-- SAFE TO RE-RUN. Requires 0008 (projects), 0024 (assignments), 0034 (tiers).
-- =============================================================================

-- ---------------------------------------------------------------- helpers --

/**
 * The signed-in profile's role tier, or 0 when they have no role.
 *
 * Separate from effective_level() because that answers "what may they do to a
 * module"; this answers "how senior are they", which is what decides whether
 * portfolio-wide visibility is reasonable.
 */
create or replace function private.current_role_level()
returns smallint
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((
    select r.level
      from public.profiles p
      join public.roles r on r.id = p.role_id
     where p.id = (select auth.uid())
       and p.is_active
  ), 0::smallint);
$$;

comment on function private.current_role_level() is
  'Role tier of the signed-in profile (public.roles.level), 0 when unassigned '
  'or inactive. Used to decide portfolio-wide vs assignment-scoped visibility.';

revoke all on function private.current_role_level() from public, anon;
grant execute on function private.current_role_level() to authenticated;

/**
 * Is the signed-in profile on this project's team?
 *
 * An assignment with an end date in the past no longer grants access: a
 * contractor who rolled off should stop seeing the work, and evaluating that
 * on read means no scheduled job has to remember to revoke it.
 */
create or replace function private.is_assigned_to_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.project_assignments a
     where a.project_id = p_project
       and a.profile_id = (select auth.uid())
       and (a.starts_on is null or a.starts_on <= current_date)
       and (a.ends_on   is null or a.ends_on   >= current_date)
  );
$$;

comment on function private.is_assigned_to_project(uuid) is
  'True when the caller holds a live project_assignments row. Expiry is '
  'evaluated on read so a lapsed assignment cannot keep working.';

revoke all on function private.is_assigned_to_project(uuid) from public, anon;
grant execute on function private.is_assigned_to_project(uuid) to authenticated;

-- ------------------------------------------------- scoped project access --

create or replace function private.can_see_project(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.projects pr
     where pr.id = p_project
       and (
         private.is_admin()
         or pr.organization_id = private.current_org_id()
         or pr.lead_id = (select auth.uid())
         or (
           private.current_portal() = 'STAFF'
           and (
             private.is_assigned_to_project(p_project)
             or private.current_role_level() >= 3
           )
         )
       )
  );
$$;

comment on function private.can_see_project(uuid) is
  'Admin, the owning client organisation, the project lead, an assigned staff '
  'member, or a staff member at role tier 3+. Portal alone is NOT access.';

revoke all on function private.can_see_project(uuid) from public, anon;
grant execute on function private.can_see_project(uuid) to authenticated;

drop policy if exists projects_select on public.projects;

-- Mirrors can_see_project. Kept inline rather than calling the function so the
-- planner can push the organisation and lead comparisons into the scan instead
-- of executing a definer function per row.
create policy projects_select on public.projects
  for select to authenticated
  using (
    private.is_admin()
    or organization_id = private.current_org_id()
    or lead_id = (select auth.uid())
    or (
      private.current_portal() = 'STAFF'
      and (
        private.is_assigned_to_project(id)
        or private.current_role_level() >= 3
      )
    )
  );

-- ----------------------------------------------------- milestone authoring --

-- Was admin-only, which is why no milestone could be created from the staff
-- portal and the seven live rows all came from seed/demo_projects.sql. A lead
-- who can see a project should be able to plan it.
drop policy if exists project_milestones_insert_admin on public.project_milestones;
drop policy if exists project_milestones_update_admin on public.project_milestones;
drop policy if exists project_milestones_delete_admin on public.project_milestones;

-- The three above drop what this REPLACES; these three drop what it CREATES.
-- Without them a second run fails on "policy already exists" and aborts
-- part-way — the old admin-only policies dropped, the new ones only partly
-- created, and everything after this block never reached. Renaming a policy
-- needs both halves, which is the same trap 0048 hit.
drop policy if exists project_milestones_insert on public.project_milestones;
drop policy if exists project_milestones_update on public.project_milestones;
drop policy if exists project_milestones_delete on public.project_milestones;

create policy project_milestones_insert on public.project_milestones
  for insert to authenticated
  with check (
    private.is_admin()
    or (private.current_portal() = 'STAFF' and private.can_see_project(project_id))
  );

create policy project_milestones_update on public.project_milestones
  for update to authenticated
  using (
    private.is_admin()
    or (private.current_portal() = 'STAFF' and private.can_see_project(project_id))
  )
  with check (
    private.is_admin()
    or (private.current_portal() = 'STAFF' and private.can_see_project(project_id))
  );

create policy project_milestones_delete on public.project_milestones
  for delete to authenticated
  using (
    private.is_admin()
    or (private.current_portal() = 'STAFF' and private.can_see_project(project_id))
  );

-- ------------------------------------------------------------- perf nit --

-- auth.uid() called bare is re-evaluated per row; the scalar subquery form is
-- evaluated once. 0054 applied this to policy predicates and missed the
-- function bodies those predicates call.
create or replace function private.in_channel(p_channel uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
      from public.channel_participants cp
     where cp.channel_id = p_channel
       and cp.profile_id = (select auth.uid())
  );
$$;

revoke all on function private.in_channel(uuid) from public, anon;
grant execute on function private.in_channel(uuid) to authenticated;

-- --------------------------------------------------------------- realtime --

-- The one table a client most wants live and the only project child not
-- published. Without this the Milestone Roadmap and the "Next Milestone" KPI
-- stay stale until a manual refresh.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
     where pubname = 'supabase_realtime'
       and schemaname = 'public'
       and tablename = 'project_milestones'
  ) then
    alter publication supabase_realtime add table public.project_milestones;
  end if;
end $$;

-- --------------------------------------------- allocation upsert repair --

-- `saveAssignment()` has always called
--   .upsert({...}, { onConflict: "project_id,profile_id" })
-- and there was no unique constraint on that pair, so Postgres rejected every
-- call with 42P10 ("no unique or exclusion constraint matching the ON CONFLICT
-- specification"). That is why project_assignments is empty despite a complete
-- allocation UI: the feature has never once succeeded.
--
-- The constraint is also correct on its own terms — the same person assigned to
-- the same project twice is not a meaningful state, and the allocation heatmap
-- would double-count their hours.
do $$
begin
  if not exists (
    select 1 from pg_constraint
     where conrelid = 'public.project_assignments'::regclass
       and conname  = 'project_assignments_project_profile_key'
  ) then
    -- Safe: deduplicate first so this cannot fail on a database that already
    -- has rows, keeping the most recently updated of each pair.
    delete from public.project_assignments a
     using public.project_assignments b
     where a.project_id = b.project_id
       and a.profile_id = b.profile_id
       and (a.updated_at, a.id) < (b.updated_at, b.id);

    alter table public.project_assignments
      add constraint project_assignments_project_profile_key
      unique (project_id, profile_id);
  end if;
end $$;

-- ------------------------------------------- preserve existing access --

-- One-time backfill so the predicate change is access-neutral on the data that
-- exists today. Idempotent via the constraint added immediately above.
insert into public.project_assignments (project_id, profile_id, role_on_project, hours_per_week)
select pr.id, p.id, 'Contributor', 0
  from public.projects pr
 cross join public.profiles p
 where p.portal = 'STAFF'
   and p.is_active
on conflict (project_id, profile_id) do nothing;

create index if not exists project_assignments_profile_project_idx
  on public.project_assignments (profile_id, project_id);

select private.record_migration('0061', 'assignment_scoped_staff_access');
