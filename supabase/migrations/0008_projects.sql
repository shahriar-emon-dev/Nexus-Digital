-- =============================================================================
-- 0008_projects.sql
--
-- Feature 5 (dependency) — Projects, milestones and board tasks.
--
-- Ordering note: the plan put Dashboard at this position. Every figure on both
-- dashboards — pipeline value, on-time completion, active projects, next
-- milestone — is a rollup of projects, milestones and invoices. Seeding a
-- `dashboard_metrics` table with $2,140,000 would move a hardcoded number out
-- of a file and into a row without making it any less invented, so the entity
-- the dashboards summarise is migrated first.
--
-- The progress invariant from lib/client-portal.ts is preserved and now
-- enforced in the database rather than by comment: a project's progress is the
-- milestone rollup, so `progress` is GENERATED from the milestones instead of
-- stored independently where the two can drift apart.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='project_status') then
    create type public.project_status as enum ('Active','On Hold','Completed','Archived');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='milestone_status') then
    create type public.milestone_status as enum ('done','active','upcoming','final');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='board_column') then
    create type public.board_column as enum ('backlog','in-progress','review','done');
  end if;
end $$;

-- -------------------------------------------------------------- projects ----

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slug            text not null,
  name            text not null,
  description     text not null default '',
  status          public.project_status not null default 'Active',
  stage           text not null default '',
  lead_id         uuid references public.profiles (id) on delete set null,
  start_date      date,
  target_end      date,
  budget_total    numeric(12,2) not null default 0 check (budget_total >= 0),
  budget_spent    numeric(12,2) not null default 0 check (budget_spent >= 0),
  -- Presentation hints kept alongside the record so a project renders the same
  -- everywhere without a second lookup table.
  tone            text not null default 'brand' check (tone in ('brand','ion','orchid')),
  icon            text not null default 'chart',
  featured        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint projects_budget_sane check (budget_spent <= budget_total * 1.5),
  constraint projects_dates_ordered check (target_end is null or start_date is null or target_end >= start_date)
);

comment on table public.projects is
  'Client engagements. Progress is derived from milestones, never stored.';

create unique index if not exists projects_org_slug_key on public.projects (organization_id, slug);
create index if not exists projects_org_idx     on public.projects (organization_id);
create index if not exists projects_status_idx  on public.projects (status);
create index if not exists projects_lead_idx    on public.projects (lead_id);

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at before update on public.projects
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------ milestones ----

create table if not exists public.project_milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  phase        text not null,
  title        text not null,
  description  text not null default '',
  status       public.milestone_status not null default 'upcoming',
  due_date     date,
  -- Only the `active` milestone carries one; 0-100.
  progress     int check (progress is null or progress between 0 and 100),
  lead_id      uuid references public.profiles (id) on delete set null,
  display_order int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists project_milestones_project_idx on public.project_milestones (project_id, display_order);

drop trigger if exists project_milestones_set_updated_at on public.project_milestones;
create trigger project_milestones_set_updated_at before update on public.project_milestones
  for each row execute function private.set_updated_at();

-- ----------------------------------------------------------- board tasks ----

create table if not exists public.project_tasks (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references public.projects (id) on delete cascade,
  column_id         public.board_column not null default 'backlog',
  title             text not null,
  description       text not null default '',
  discipline        text not null default '',
  assignee_id       uuid references public.profiles (id) on delete set null,
  awaiting_approval boolean not null default false,
  priority          boolean not null default false,
  display_order     int not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists project_tasks_project_idx on public.project_tasks (project_id, column_id, display_order);

drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at before update on public.project_tasks
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------- progress as a view ----
-- `(completed + activeFraction) / total`, exactly the invariant the module
-- documented in a comment. Computed, so the roadmap and the overview card can
-- never quote different numbers.

create or replace view public.project_progress
with (security_invoker = true) as
  select
    p.id as project_id,
    count(m.*)                                              as milestone_total,
    count(*) filter (where m.status = 'done')               as milestone_done,
    case
      when count(m.*) = 0 then 0
      else round(
        ( count(*) filter (where m.status = 'done')
          + coalesce(sum(m.progress) filter (where m.status = 'active'), 0) / 100.0
        ) * 100.0 / count(m.*)
      )::int
    end                                                     as progress
  from public.projects p
  left join public.project_milestones m on m.project_id = p.id
  group by p.id;

comment on view public.project_progress is
  'Milestone rollup per project. security_invoker so the caller''s RLS on '
  'projects and milestones still applies through the view.';

-- ------------------------------------------------------------------ RLS ----

alter table public.projects           enable row level security;
alter table public.project_milestones enable row level security;
alter table public.project_tasks      enable row level security;

-- Membership test used by every policy below. SECURITY DEFINER so it can read
-- profiles without re-entering profile RLS.
create or replace function private.can_see_project(p_project uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
      from public.projects pr
     where pr.id = p_project
       and (
         private.is_admin()
         or pr.organization_id = private.current_org_id()
         or pr.lead_id = (select auth.uid())
         or exists (select 1 from public.profiles me
                     where me.id = (select auth.uid()) and me.portal = 'STAFF')
       )
  );
$$;
revoke all on function private.can_see_project(uuid) from public, anon;
grant execute on function private.can_see_project(uuid) to authenticated;

drop policy if exists projects_select        on public.projects;
drop policy if exists projects_insert_admin  on public.projects;
drop policy if exists projects_update_admin  on public.projects;
drop policy if exists projects_delete_admin  on public.projects;

-- A client sees their organisation's projects; staff see all (they deliver
-- them); admins see everything. One policy so the planner evaluates once.
create policy projects_select on public.projects
  for select to authenticated
  using (
    private.is_admin()
    or organization_id = private.current_org_id()
    or lead_id = (select auth.uid())
    or private.current_portal() = 'STAFF'
  );

create policy projects_insert_admin on public.projects
  for insert to authenticated with check (private.is_admin());
create policy projects_update_admin on public.projects
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy projects_delete_admin on public.projects
  for delete to authenticated using (private.is_admin());

drop policy if exists project_milestones_select       on public.project_milestones;
drop policy if exists project_milestones_write_admin  on public.project_milestones;

create policy project_milestones_select on public.project_milestones
  for select to authenticated using (private.can_see_project(project_id));
create policy project_milestones_write_admin on public.project_milestones
  for all to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists project_tasks_select      on public.project_tasks;
drop policy if exists project_tasks_write_staff on public.project_tasks;

create policy project_tasks_select on public.project_tasks
  for select to authenticated using (private.can_see_project(project_id));

-- Staff and admins move cards; clients read the board and approve reviews
-- through their own surface rather than by writing tasks directly.
create policy project_tasks_write_staff on public.project_tasks
  for all to authenticated
  using (private.is_admin() or private.current_portal() = 'STAFF')
  with check (private.is_admin() or private.current_portal() = 'STAFF');

-- -------------------------------------------------------------- realtime ---

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='project_tasks') then
    alter publication supabase_realtime add table public.project_tasks;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='projects') then
    alter publication supabase_realtime add table public.projects;
  end if;
end $$;

select private.record_migration('0008', 'projects');
