-- =============================================================================
-- 0025_client_accounts.sql
--
-- Account management fields for the Client Directory.
--
-- The screen showed eight clients with owners, MRR, project counts and renewal
-- dates over a table that had a name, a slug and an industry. Every one of
-- those columns was hardcoded in the page component.
--
-- These are the fields that genuinely belong on the record. MRR and project
-- count are deliberately NOT among them: both are derivable, and a stored copy
-- drifts from the ledger the moment an invoice changes. They come from views.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql and 0021_invoices.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'account_health') then
    create type public.account_health as enum ('onboarding','healthy','at-risk','churned');
  end if;
end $$;

alter table public.organizations
  add column if not exists health public.account_health not null default 'onboarding',
  add column if not exists account_manager_id uuid references public.profiles (id) on delete set null,
  add column if not exists renews_on date,
  add column if not exists website text,
  add column if not exists notes text;

create index if not exists organizations_manager_idx on public.organizations (account_manager_id);
create index if not exists organizations_health_idx  on public.organizations (health);

/**
 * Revenue per client, derived from invoices rather than stored.
 *
 * A stored MRR is a number somebody typed that disagrees with the ledger the
 * moment an invoice changes. This reads the same invoice_totals view the
 * invoices screen does, so the two can never contradict each other.
 */
create or replace view public.client_revenue
with (security_invoker = true) as
select
  o.id                                                              as organization_id,
  coalesce(sum(t.total)       filter (where i.status <> 'void'), 0) as billed_total,
  coalesce(sum(t.paid)        filter (where i.status <> 'void'), 0) as collected_total,
  coalesce(sum(t.outstanding) filter (where i.status <> 'void'), 0) as outstanding_total,
  -- Trailing twelve months divided by twelve: an honest monthly average
  -- rather than a contract value presented as recurring revenue.
  round(coalesce(sum(t.total) filter (
    where i.status <> 'void' and i.issue_date >= current_date - interval '12 months'
  ), 0) / 12.0, 2)                                                  as monthly_average,
  count(i.id) filter (where i.status <> 'void')                     as invoice_count
from public.organizations o
left join public.invoices i       on i.organization_id = o.id
left join public.invoice_totals t on t.invoice_id = i.id
group by o.id;

comment on view public.client_revenue is
  'Revenue per client, derived from invoice_totals. Nothing here is stored, so '
  'it cannot drift from the ledger.';

create or replace view public.client_project_counts
with (security_invoker = true) as
select
  o.id                                           as organization_id,
  count(p.id)                                    as project_count,
  count(p.id) filter (where p.status = 'Active') as active_project_count
from public.organizations o
left join public.projects p on p.organization_id = o.id
group by o.id;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'organizations') then
    alter publication supabase_realtime add table public.organizations;
  end if;
end $$;

select private.record_migration('0025', 'client_accounts');
