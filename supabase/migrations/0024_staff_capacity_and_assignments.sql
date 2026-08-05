-- =============================================================================
-- 0024_staff_capacity_and_assignments.sql
--
-- Staff capacity and project assignments.
--
-- The Resource Heatmap reported 93.3% global utilisation, 42.8 weekly velocity
-- and a 12.5% overhead ratio over a roster with no hours and no assignments
-- recorded anywhere. Those figures could not have been computed from anything;
-- they were typed. This migration is the data they would need to be true.
--
-- It also closes a gap left in project-queries.ts, which returned an empty
-- team for every project because there was no table saying who was on one.
--
-- SAFE TO RE-RUN. Requires 0008_projects.sql and 0019_staff_directory.sql.
-- =============================================================================

alter table public.staff_profiles
  add column if not exists weekly_capacity_hours numeric(5,1) not null default 40
    check (weekly_capacity_hours >= 0 and weekly_capacity_hours <= 168),
  add column if not exists seniority text,
  add column if not exists is_billable boolean not null default true;

comment on column public.staff_profiles.weekly_capacity_hours is
  'Contracted hours per week. Utilisation is assigned hours over this, so a '
  'part-time specialist is not read as underutilised.';

create table if not exists public.project_assignments (
  id              uuid primary key default gen_random_uuid(),
  project_id      uuid not null references public.projects (id) on delete cascade,
  profile_id      uuid not null references public.profiles (id) on delete cascade,
  role_on_project text not null default '',
  hours_per_week  numeric(5,1) not null default 0
    check (hours_per_week >= 0 and hours_per_week <= 168),
  starts_on       date,
  ends_on         date,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint project_assignments_dates_ordered
    check (ends_on is null or starts_on is null or ends_on >= starts_on)
);

comment on table public.project_assignments is
  'Who is on which project and for how many hours a week. The single source '
  'for both the project team list and the allocation heatmap.';

create unique index if not exists project_assignments_unique
  on public.project_assignments (project_id, profile_id);
create index if not exists project_assignments_profile_idx
  on public.project_assignments (profile_id);

drop trigger if exists project_assignments_set_updated_at on public.project_assignments;
create trigger project_assignments_set_updated_at before update on public.project_assignments
  for each row execute function private.set_updated_at();

alter table public.project_assignments enable row level security;

drop policy if exists project_assignments_select on public.project_assignments;
drop policy if exists project_assignments_write  on public.project_assignments;

-- Visible to anyone who can see the project, so a client sees their own team.
create policy project_assignments_select on public.project_assignments
  for select to authenticated using (private.can_see_project(project_id));
create policy project_assignments_write on public.project_assignments
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

/**
 * Utilisation per person, derived rather than stored.
 *
 * Counts only assignments live today: an engagement that ended last month
 * should not keep a specialist looking booked.
 */
create or replace view public.staff_utilisation
with (security_invoker = true) as
select
  s.id                                   as profile_id,
  s.weekly_capacity_hours                as capacity_hours,
  coalesce(sum(a.hours_per_week), 0)     as assigned_hours,
  count(a.id)                            as project_count,
  case
    when s.weekly_capacity_hours > 0
      then round((coalesce(sum(a.hours_per_week), 0) / s.weekly_capacity_hours) * 100)
    else null
  end                                    as utilisation_pct
from public.staff_profiles s
left join public.project_assignments a
  on a.profile_id = s.id
 and (a.starts_on is null or a.starts_on <= current_date)
 and (a.ends_on   is null or a.ends_on   >= current_date)
group by s.id, s.weekly_capacity_hours;

comment on view public.staff_utilisation is
  'Assigned hours over contracted hours, counting only assignments live today.';

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'project_assignments') then
    alter publication supabase_realtime add table public.project_assignments;
  end if;
end $$;

select private.record_migration('0024', 'staff_capacity_and_assignments');
