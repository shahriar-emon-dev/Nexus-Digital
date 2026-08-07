-- =============================================================================
-- 0050_meetings_files_time_deliverables.sql
--
-- Scheduling, file sharing, time tracking and the deliverable review flow.
-- All four had UI built against a static TypeScript file and no table.
--
-- Everything project-scoped reuses private.can_see_project(), so a client sees
-- exactly the projects they already see and nothing widens by accident.
--
-- SAFE TO RE-RUN. Requires 0049.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where n.nspname='public' and t.typname='meeting_kind') then
    create type public.meeting_kind as enum ('Review','Workshop','Standup','Handover');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where n.nspname='public' and t.typname='meeting_status') then
    create type public.meeting_status as enum ('Scheduled','Live','Completed','Cancelled');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where n.nspname='public' and t.typname='deliverable_status') then
    create type public.deliverable_status as enum ('In review','Changes requested','Approved');
  end if;
end $$;

create table if not exists public.meetings (
  id               uuid primary key default gen_random_uuid(),
  title            text not null check (length(btrim(title)) between 2 and 160),
  kind             public.meeting_kind   not null default 'Review',
  status           public.meeting_status not null default 'Scheduled',
  starts_at        timestamptz not null,
  duration_minutes int not null default 30 check (duration_minutes between 5 and 600),
  project_id       uuid references public.projects (id) on delete cascade,
  organization_id  uuid references public.organizations (id) on delete cascade,
  agenda           text[] not null default '{}',
  -- Completed meetings only; null until there is something to record.
  recap            jsonb,
  location         text,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint meetings_recap_only_when_done check (recap is null or status = 'Completed')
);

create table if not exists public.meeting_participants (
  meeting_id uuid not null references public.meetings (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  response   text not null default 'invited'
             check (response in ('invited','accepted','declined','tentative')),
  primary key (meeting_id, profile_id)
);

create table if not exists public.project_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  uploaded_by  uuid references public.profiles (id) on delete set null,
  name         text not null,
  storage_path text not null unique,
  mime_type    text,
  size_bytes   bigint check (size_bytes is null or size_bytes >= 0),
  created_at   timestamptz not null default now()
);

create table if not exists public.time_entries (
  id         uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  task_id    uuid references public.project_tasks (id) on delete set null,
  minutes    int not null check (minutes > 0 and minutes <= 1440),
  note       text,
  spent_on   date not null default current_date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliverables (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  task_id    uuid references public.project_tasks (id) on delete set null,
  title      text not null,
  discipline text,
  status     public.deliverable_status not null default 'In review',
  owner_id   uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deliverable_versions (
  id             uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  label          text not null,
  released_on    timestamptz not null default now(),
  media_url      text,
  alt            text,
  summary        text,
  created_at     timestamptz not null default now(),
  unique (deliverable_id, label)
);

create table if not exists public.deliverable_annotations (
  id         uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.deliverable_versions (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  -- Fractions of the image, so a pin stays where it was put at any render size.
  x          numeric(5,4) not null check (x between 0 and 1),
  y          numeric(5,4) not null check (y between 0 and 1),
  body       text not null,
  resolved   boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists meetings_starts_idx       on public.meetings (starts_at desc);
create index if not exists meetings_project_idx      on public.meetings (project_id);
create index if not exists meetings_org_idx          on public.meetings (organization_id);
create index if not exists meetings_creator_idx      on public.meetings (created_by);
create index if not exists meeting_participants_profile_idx on public.meeting_participants (profile_id);
create index if not exists project_files_project_idx  on public.project_files (project_id, created_at desc);
create index if not exists project_files_uploader_idx on public.project_files (uploaded_by);
create index if not exists time_entries_profile_idx   on public.time_entries (profile_id, spent_on desc);
create index if not exists time_entries_project_idx   on public.time_entries (project_id);
create index if not exists time_entries_task_idx      on public.time_entries (task_id);
create index if not exists deliverables_project_idx   on public.deliverables (project_id);
create index if not exists deliverables_task_idx      on public.deliverables (task_id);
create index if not exists deliverables_owner_idx     on public.deliverables (owner_id);
create index if not exists deliverable_versions_parent_idx      on public.deliverable_versions (deliverable_id, released_on desc);
create index if not exists deliverable_annotations_version_idx  on public.deliverable_annotations (version_id);
create index if not exists deliverable_annotations_author_idx   on public.deliverable_annotations (author_id);

do $$
declare t text;
begin
  foreach t in array array['meetings','time_entries','deliverables'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function private.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.meetings                enable row level security;
alter table public.meeting_participants    enable row level security;
alter table public.project_files           enable row level security;
alter table public.time_entries            enable row level security;
alter table public.deliverables            enable row level security;
alter table public.deliverable_versions    enable row level security;
alter table public.deliverable_annotations enable row level security;

drop policy if exists meetings_select on public.meetings;
create policy meetings_select on public.meetings for select to authenticated
  using (private.is_admin()
         or (project_id is not null and private.can_see_project(project_id))
         or (organization_id is not null and organization_id = private.current_org_id())
         or exists (select 1 from public.meeting_participants mp
                    where mp.meeting_id = meetings.id and mp.profile_id = auth.uid()));

drop policy if exists meetings_write on public.meetings;
create policy meetings_write on public.meetings for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');
drop policy if exists meetings_update on public.meetings;
create policy meetings_update on public.meetings for update to authenticated
  using (private.is_admin() or created_by = auth.uid())
  with check (private.is_admin() or created_by = auth.uid());
drop policy if exists meetings_delete on public.meetings;
create policy meetings_delete on public.meetings for delete to authenticated
  using (private.is_admin() or created_by = auth.uid());

drop policy if exists meeting_participants_select on public.meeting_participants;
create policy meeting_participants_select on public.meeting_participants for select to authenticated
  using (private.is_admin() or profile_id = auth.uid()
         or exists (select 1 from public.meetings m
                    where m.id = meeting_id and m.created_by = auth.uid()));
drop policy if exists meeting_participants_insert on public.meeting_participants;
create policy meeting_participants_insert on public.meeting_participants for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');
drop policy if exists meeting_participants_update_self on public.meeting_participants;
create policy meeting_participants_update_self on public.meeting_participants for update to authenticated
  using (profile_id = auth.uid() or private.is_admin())
  with check (profile_id = auth.uid() or private.is_admin());
drop policy if exists meeting_participants_delete on public.meeting_participants;
create policy meeting_participants_delete on public.meeting_participants for delete to authenticated
  using (private.is_admin());

drop policy if exists project_files_select on public.project_files;
create policy project_files_select on public.project_files for select to authenticated
  using (private.is_admin() or private.can_see_project(project_id));
drop policy if exists project_files_insert on public.project_files;
create policy project_files_insert on public.project_files for insert to authenticated
  with check (uploaded_by = auth.uid() and private.can_see_project(project_id));
drop policy if exists project_files_delete on public.project_files;
create policy project_files_delete on public.project_files for delete to authenticated
  using (private.is_admin() or uploaded_by = auth.uid());

-- Time is logged against yourself only: a staff member cannot bill hours in
-- somebody else's name, and clients have no reason to see internal time at all.
drop policy if exists time_entries_select on public.time_entries;
create policy time_entries_select on public.time_entries for select to authenticated
  using (profile_id = auth.uid()
         or private.is_admin()
         or private.effective_level('staff-hr-records') >= 'view');
drop policy if exists time_entries_insert on public.time_entries;
create policy time_entries_insert on public.time_entries for insert to authenticated
  with check (profile_id = auth.uid());
drop policy if exists time_entries_update on public.time_entries;
create policy time_entries_update on public.time_entries for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());
drop policy if exists time_entries_delete on public.time_entries;
create policy time_entries_delete on public.time_entries for delete to authenticated
  using (profile_id = auth.uid() or private.is_admin());

drop policy if exists deliverables_select on public.deliverables;
create policy deliverables_select on public.deliverables for select to authenticated
  using (private.is_admin() or private.can_see_project(project_id));
drop policy if exists deliverables_write on public.deliverables;
create policy deliverables_write on public.deliverables for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');
drop policy if exists deliverables_update on public.deliverables;
create policy deliverables_update on public.deliverables for update to authenticated
  using (private.is_admin() or private.can_see_project(project_id))
  with check (private.is_admin() or private.can_see_project(project_id));
drop policy if exists deliverables_delete on public.deliverables;
create policy deliverables_delete on public.deliverables for delete to authenticated
  using (private.is_admin());

drop policy if exists deliverable_versions_select on public.deliverable_versions;
create policy deliverable_versions_select on public.deliverable_versions for select to authenticated
  using (exists (select 1 from public.deliverables d
                 where d.id = deliverable_id
                   and (private.is_admin() or private.can_see_project(d.project_id))));
drop policy if exists deliverable_versions_write on public.deliverable_versions;
create policy deliverable_versions_write on public.deliverable_versions for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');
drop policy if exists deliverable_versions_delete on public.deliverable_versions;
create policy deliverable_versions_delete on public.deliverable_versions for delete to authenticated
  using (private.is_admin());

drop policy if exists deliverable_annotations_select on public.deliverable_annotations;
create policy deliverable_annotations_select on public.deliverable_annotations for select to authenticated
  using (exists (select 1 from public.deliverable_versions v
                 join public.deliverables d on d.id = v.deliverable_id
                 where v.id = version_id
                   and (private.is_admin() or private.can_see_project(d.project_id))));
drop policy if exists deliverable_annotations_insert on public.deliverable_annotations;
create policy deliverable_annotations_insert on public.deliverable_annotations for insert to authenticated
  with check (author_id = auth.uid()
              and exists (select 1 from public.deliverable_versions v
                          join public.deliverables d on d.id = v.deliverable_id
                          where v.id = version_id
                            and (private.is_admin() or private.can_see_project(d.project_id))));
drop policy if exists deliverable_annotations_update on public.deliverable_annotations;
create policy deliverable_annotations_update on public.deliverable_annotations for update to authenticated
  using (author_id = auth.uid() or private.is_admin())
  with check (author_id = auth.uid() or private.is_admin());
drop policy if exists deliverable_annotations_delete on public.deliverable_annotations;
create policy deliverable_annotations_delete on public.deliverable_annotations for delete to authenticated
  using (author_id = auth.uid() or private.is_admin());

do $$
declare t text;
begin
  foreach t in array array['meetings','meeting_participants','project_files','time_entries',
                           'deliverables','deliverable_versions','deliverable_annotations'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- NOTE: 0054 rewrites every auth.uid() above as (select auth.uid()). Both forms
-- are correct; the wrapped form lets the planner evaluate it once per statement
-- instead of once per row.

select private.record_migration('0050', 'meetings_files_time_deliverables');
