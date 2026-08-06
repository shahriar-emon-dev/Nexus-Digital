-- =============================================================================
-- 0037_service_delivery_history.sql
--
-- Links a service to the work that delivered it.
--
-- The service builder shows "View All Previous Projects" with a carousel,
-- "Project ID: #8821" and a "VIEW CASE STUDY" button. None of it could be
-- rendered: nothing tied a project to a service, projects had no
-- human-readable reference, and no project pointed at its case study.
--
-- SECURITY NOTE, and the reason the view is invoker-rights: "which clients
-- bought this service" is a confidential list. It must not reach the public
-- services page, so anon sees nothing here at all and a case study becomes the
-- only public route to naming an engagement — verified by role switch.
--
-- NOTE ON THE REFERENCE SEQUENCE: the trigger in this file derived the next
-- number from max() over existing rows, which allows a deleted project's
-- reference to be reissued. 0038 replaces it. The comment that claimed
-- otherwise has been corrected below rather than left to mislead.
--
-- SAFE TO RE-RUN. Requires 0008_projects.sql and 0028_service_catalogue.sql.
-- =============================================================================

-- A uuid is not something anyone reads out on a call. Invoices already had a
-- number; projects did not.
alter table public.projects
  add column if not exists reference text,
  add column if not exists case_study_page_id uuid references public.pages (id) on delete set null;

comment on column public.projects.reference is
  'Human-readable engagement reference, PRJ-YYYY-NNNN. Assigned by trigger so '
  'it cannot be forgotten or duplicated.';

create or replace function private.assign_project_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_seq  int;
begin
  if new.reference is not null and btrim(new.reference) <> '' then
    return new;
  end if;

  -- Highest existing sequence for the year. NOTE: this cannot see a deleted
  -- project, so a retired reference can be reissued — superseded by 0038.
  select coalesce(max((regexp_replace(reference, '^PRJ-\d{4}-', ''))::int), 0) + 1
    into v_seq
    from public.projects
   where reference like 'PRJ-' || v_year || '-%'
     and reference ~ ('^PRJ-' || v_year || '-\d+$');

  new.reference := 'PRJ-' || v_year || '-' || lpad(v_seq::text, 4, '0');
  return new;
end $$;

drop trigger if exists projects_assign_reference on public.projects;
create trigger projects_assign_reference before insert on public.projects
  for each row execute function private.assign_project_reference();

-- Backfill in a stable order so references match delivery order.
do $$
declare r record; n int := 0; y text;
begin
  for r in select id, created_at from public.projects where reference is null order by created_at loop
    y := to_char(r.created_at, 'YYYY');
    n := n + 1;
    update public.projects
       set reference = 'PRJ-' || y || '-' || lpad(n::text, 4, '0')
     where id = r.id;
  end loop;
end $$;

create unique index if not exists projects_reference_key on public.projects (reference);
create index if not exists projects_case_study_idx on public.projects (case_study_page_id);

/**
 * Which services a project delivered. Many-to-many, because one engagement
 * routinely spans several service lines and one service spans many engagements.
 */
create table if not exists public.project_services (
  project_id      uuid not null references public.projects (id) on delete cascade,
  service_page_id uuid not null references public.pages (id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (project_id, service_page_id)
);

comment on table public.project_services is
  'Which services an engagement delivered. NOT public: the client list behind a '
  'service is confidential until a case study is published.';

create index if not exists project_services_service_idx on public.project_services (service_page_id);

alter table public.project_services enable row level security;

drop policy if exists project_services_select on public.project_services;
drop policy if exists project_services_insert on public.project_services;
drop policy if exists project_services_delete on public.project_services;

-- Scoped to whoever can already see the project. Anon gets nothing at all:
-- "which clients bought this service" is exactly the sort of list that must not
-- leak from a public services page.
create policy project_services_select on public.project_services
  for select to authenticated using (private.can_see_project(project_id));
create policy project_services_insert on public.project_services
  for insert to authenticated with check (private.is_admin());
create policy project_services_delete on public.project_services
  for delete to authenticated using (private.is_admin());

/**
 * Delivery history for the builder's "Previous Projects" carousel.
 *
 * security_invoker, so the RLS above decides what each caller sees rather than
 * the view handing everyone the full client list.
 */
create or replace view public.service_delivery_history
with (security_invoker = true) as
select
  ps.service_page_id,
  p.id                    as project_id,
  p.reference,
  p.name,
  p.status,
  p.budget_total,
  p.start_date,
  p.target_end,
  o.name                  as client_name,
  p.case_study_page_id,
  cs.slug                 as case_study_slug,
  cs.status = 'published' as case_study_published
from public.project_services ps
join public.projects p           on p.id = ps.project_id
left join public.organizations o on o.id = p.organization_id
left join public.pages cs        on cs.id = p.case_study_page_id;

comment on view public.service_delivery_history is
  'Projects that delivered a service, with the case study when one is '
  'published. Invoker rights, so client names never escape the project policy.';

select private.record_migration('0037', 'service_delivery_history');
