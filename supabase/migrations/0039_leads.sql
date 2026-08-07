-- =============================================================================
-- 0039_leads.sql
--
-- Inbound leads.
--
-- The public contact form carried "TODO: POST to a real endpoint. Nothing
-- leaves the browser today." It validated the fields, waited 1.4 seconds, and
-- showed a success state — while throwing the enquiry away. Every message
-- anyone has ever sent through this site is gone. This is the table that stops
-- that happening again.
--
-- SAFE TO RE-RUN. Requires 0035_temporary_access_grants.sql (effective_level).
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname='public' and t.typname='lead_status') then
    create type public.lead_status as enum ('new','contacted','qualified','won','lost');
  end if;
end $$;

create table if not exists public.leads (
  id                uuid primary key default gen_random_uuid(),
  reference         text,
  full_name         text not null check (length(btrim(full_name)) between 2 and 120),
  email             text not null check (position('@' in email) > 1),
  company           text,
  phone             text,
  project_title     text,
  brief             text not null default '',
  -- Links to the CMS service when the enquiry came from one, so "Service
  -- Intent" survives the service being renamed.
  service_page_id   uuid references public.pages (id) on delete set null,
  service_intent    text,
  -- Nullable on purpose: the design shows "TBD" for a lead nobody has sized
  -- yet, and 0 would drag the forecast down as though it were worth nothing.
  estimated_value   numeric(12,2) check (estimated_value is null or estimated_value >= 0),
  currency          char(3) not null default 'USD',
  status            public.lead_status not null default 'new',
  source            text not null default 'web-form',
  assignee_id       uuid references public.profiles (id) on delete set null,
  -- Set when a lead becomes a client, so the CRM can show what it turned into.
  organization_id   uuid references public.organizations (id) on delete set null,
  notes             text,
  contacted_at      timestamptz,
  closed_at         timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint leads_closed_when_decided check (
    (status in ('won','lost') and closed_at is not null)
    or (status not in ('won','lost') and closed_at is null)
  )
);

comment on table public.leads is
  'Inbound enquiries. Anonymous visitors may INSERT only; reading requires a '
  'CRM grant, so the public form cannot be used to enumerate the pipeline.';

create index if not exists leads_status_idx   on public.leads (status);
create index if not exists leads_created_idx  on public.leads (created_at desc);
create index if not exists leads_assignee_idx on public.leads (assignee_id);
create index if not exists leads_service_idx  on public.leads (service_page_id);
create index if not exists leads_org_idx      on public.leads (organization_id);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
  for each row execute function private.set_updated_at();

-- Reuses the monotonic counter from 0038 rather than inventing a second
-- numbering mechanism that would drift from it.
create or replace function private.assign_lead_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_prefix text := 'LEAD-' || to_char(now(), 'YYYY');
  v_seq    int;
begin
  if new.reference is not null and btrim(new.reference) <> '' then
    return new;
  end if;

  insert into private.reference_counters (prefix, next_value)
  values (v_prefix, 2)
  on conflict (prefix) do update
    set next_value = private.reference_counters.next_value + 1
  returning case when xmax = 0 then 1 else private.reference_counters.next_value - 1 end
    into v_seq;

  new.reference := v_prefix || '-' || lpad(v_seq::text, 6, '0');
  return new;
end $$;

drop trigger if exists leads_assign_reference on public.leads;
create trigger leads_assign_reference before insert on public.leads
  for each row execute function private.assign_lead_reference();

create unique index if not exists leads_reference_key on public.leads (reference);

alter table public.leads enable row level security;

drop policy if exists leads_insert_public on public.leads;
drop policy if exists leads_select_crm    on public.leads;
drop policy if exists leads_update_crm    on public.leads;
drop policy if exists leads_delete_crm    on public.leads;

-- A visitor may submit and nothing else. The WITH CHECK pins the fields a
-- crafted POST would otherwise use to plant a qualified, assigned, already-won
-- lead straight into the pipeline. Verified by role switch: an anon insert
-- setting status='won' or assignee_id is refused.
create policy leads_insert_public on public.leads
  for insert to anon, authenticated
  with check (
    status = 'new'
    and assignee_id is null
    and organization_id is null
    and closed_at is null
    and contacted_at is null
  );

create policy leads_select_crm on public.leads
  for select to authenticated
  using (private.effective_level('crm-database') >= 'view');
create policy leads_update_crm on public.leads
  for update to authenticated
  using (private.effective_level('crm-database') >= 'edit')
  with check (private.effective_level('crm-database') >= 'edit');
create policy leads_delete_crm on public.leads
  for delete to authenticated
  using (private.effective_level('crm-database') >= 'admin');

/**
 * Pipeline figures for the CRM header, derived rather than stored.
 *
 * Conversion is won over DECIDED leads, not over every lead ever received —
 * counting open enquiries as failures understates the rate and moves whenever a
 * new lead arrives, which is not what "conversion" means. Null until something
 * has actually been won or lost.
 */
create or replace view public.lead_pipeline
with (security_invoker = true) as
select
  count(*)                                             as total,
  count(*) filter (where status = 'new')               as new_count,
  count(*) filter (where status = 'contacted')         as contacted_count,
  count(*) filter (where status = 'qualified')         as qualified_count,
  count(*) filter (where status = 'won')               as won_count,
  count(*) filter (where status = 'lost')              as lost_count,
  count(*) filter (where status not in ('won','lost')) as open_count,
  case
    when count(*) filter (where status in ('won','lost')) > 0
      then round(
        count(*) filter (where status = 'won')::numeric
        / count(*) filter (where status in ('won','lost')) * 100, 1)
    else null
  end                                                  as conversion_pct,
  -- Only leads still in play, and only those someone has actually sized.
  coalesce(sum(estimated_value) filter (where status not in ('won','lost')), 0) as open_value,
  coalesce(sum(estimated_value) filter (where status = 'won'), 0)               as won_value,
  count(*) filter (where status not in ('won','lost') and estimated_value is null) as unsized_count
from public.leads;

comment on view public.lead_pipeline is
  'Pipeline counts and value. Conversion is won over decided leads; unsized '
  'leads are counted separately rather than treated as zero.';

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime'
    and schemaname='public' and tablename='leads') then
    alter publication supabase_realtime add table public.leads;
  end if;
end $$;

select private.record_migration('0039', 'leads');
