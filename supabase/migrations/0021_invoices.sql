-- =============================================================================
-- 0021_invoices.sql
--
-- Invoices, line items and payments.
--
-- No money is stored on the invoice. Subtotal, discount, tax, total, paid and
-- outstanding are all derived by the invoice_totals view, because
-- lib/invoices.ts stored a tax amount that had been reverse-engineered to hit
-- a round total — 177.50 where the arithmetic gives 203.63. A stored figure
-- that disagrees with its own line items is the defect this schema exists to
-- make impossible.
--
-- Discount and tax are percentages, not amounts, for the same reason.
--
-- SAFE TO RE-RUN. Requires 0004_user_profiles.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'invoice_status') then
    create type public.invoice_status as enum ('draft','sent','paid','overdue','void');
  end if;
end $$;

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  -- Human-facing reference. Unique across the tenant, because an invoice
  -- number appearing twice is an accounting problem, not a UI one.
  number          text not null,
  status          public.invoice_status not null default 'draft',
  issue_date      date not null default current_date,
  due_date        date,
  currency        char(3) not null default 'USD',
  discount_pct    numeric(5,2) not null default 0 check (discount_pct between 0 and 100),
  tax_pct         numeric(5,2) not null default 0 check (tax_pct between 0 and 100),
  notes           text,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint invoices_dates_ordered check (due_date is null or due_date >= issue_date)
);

comment on table public.invoices is
  'Invoice header. Money is never stored here — every total is derived from '
  'line items and payments by the invoice_totals view.';

create unique index if not exists invoices_number_key on public.invoices (number);
create index if not exists invoices_org_idx    on public.invoices (organization_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_due_idx    on public.invoices (due_date) where status <> 'paid';

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function private.set_updated_at();

create table if not exists public.invoice_line_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  description text not null,
  quantity    numeric(12,2) not null default 1 check (quantity > 0),
  unit_price  numeric(12,2) not null default 0 check (unit_price >= 0),
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  constraint invoice_line_description check (char_length(description) between 1 and 300)
);

create index if not exists invoice_line_items_invoice_idx
  on public.invoice_line_items (invoice_id, position);

create table if not exists public.invoice_payments (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices (id) on delete cascade,
  amount      numeric(12,2) not null check (amount > 0),
  paid_at     timestamptz not null default now(),
  method      text not null default 'transfer',
  reference   text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at  timestamptz not null default now()
);

create index if not exists invoice_payments_invoice_idx on public.invoice_payments (invoice_id);

-- -------------------------------------------------------------- totals -----
-- Tax is charged on the DISCOUNTED subtotal. That is the rule the previous
-- static data violated, and it is why every figure here is computed rather
-- than stored.

create or replace view public.invoice_totals
with (security_invoker = true) as
  select
    i.id as invoice_id,
    coalesce(l.subtotal, 0)                                          as subtotal,
    round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2)          as discount,
    round((coalesce(l.subtotal,0) - round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2))
          * i.tax_pct / 100, 2)                                      as tax,
    round(coalesce(l.subtotal,0)
          - round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2)
          + round((coalesce(l.subtotal,0) - round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2))
                  * i.tax_pct / 100, 2), 2)                          as total,
    coalesce(p.paid, 0)                                              as paid,
    round(coalesce(l.subtotal,0)
          - round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2)
          + round((coalesce(l.subtotal,0) - round(coalesce(l.subtotal,0) * i.discount_pct / 100, 2))
                  * i.tax_pct / 100, 2)
          - coalesce(p.paid, 0), 2)                                  as outstanding
  from public.invoices i
  left join lateral (
    select sum(li.quantity * li.unit_price) as subtotal
      from public.invoice_line_items li where li.invoice_id = i.id
  ) l on true
  left join lateral (
    select sum(pm.amount) as paid
      from public.invoice_payments pm where pm.invoice_id = i.id
  ) p on true;

comment on view public.invoice_totals is
  'Derived money for an invoice. Tax is charged on the discounted subtotal — '
  'the rule the previous static data violated by storing a reverse-engineered '
  'tax amount that produced a round total.';

-- ------------------------------------------------------------------ RLS ----

alter table public.invoices           enable row level security;
alter table public.invoice_line_items enable row level security;
alter table public.invoice_payments   enable row level security;

create or replace function private.can_see_invoice(p_invoice uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.invoices i
     where i.id = p_invoice
       and (private.is_admin()
            or i.organization_id = private.current_org_id()
            or private.current_portal() = 'STAFF')
  );
$$;
revoke all on function private.can_see_invoice(uuid) from public, anon;
grant execute on function private.can_see_invoice(uuid) to authenticated;

drop policy if exists invoices_select       on public.invoices;
drop policy if exists invoices_insert_admin on public.invoices;
drop policy if exists invoices_update_admin on public.invoices;
drop policy if exists invoices_delete_admin on public.invoices;

-- A client sees their organisation's invoices and nothing else. Drafts are
-- hidden from them: an unsent draft is internal working state.
create policy invoices_select on public.invoices
  for select to authenticated
  using (
    private.is_admin()
    or private.current_portal() = 'STAFF'
    or (organization_id = private.current_org_id() and status <> 'draft')
  );

create policy invoices_insert_admin on public.invoices
  for insert to authenticated with check (private.is_admin());
create policy invoices_update_admin on public.invoices
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy invoices_delete_admin on public.invoices
  for delete to authenticated using (private.is_admin());

drop policy if exists invoice_lines_select       on public.invoice_line_items;
drop policy if exists invoice_lines_insert_admin on public.invoice_line_items;
drop policy if exists invoice_lines_update_admin on public.invoice_line_items;
drop policy if exists invoice_lines_delete_admin on public.invoice_line_items;

create policy invoice_lines_select on public.invoice_line_items
  for select to authenticated using (private.can_see_invoice(invoice_id));
create policy invoice_lines_insert_admin on public.invoice_line_items
  for insert to authenticated with check (private.is_admin());
create policy invoice_lines_update_admin on public.invoice_line_items
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy invoice_lines_delete_admin on public.invoice_line_items
  for delete to authenticated using (private.is_admin());

drop policy if exists invoice_payments_select       on public.invoice_payments;
drop policy if exists invoice_payments_insert_admin on public.invoice_payments;
drop policy if exists invoice_payments_update_admin on public.invoice_payments;
drop policy if exists invoice_payments_delete_admin on public.invoice_payments;

create policy invoice_payments_select on public.invoice_payments
  for select to authenticated using (private.can_see_invoice(invoice_id));
create policy invoice_payments_insert_admin on public.invoice_payments
  for insert to authenticated with check (private.is_admin());
create policy invoice_payments_update_admin on public.invoice_payments
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy invoice_payments_delete_admin on public.invoice_payments
  for delete to authenticated using (private.is_admin());

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'invoices') then
    alter publication supabase_realtime add table public.invoices;
  end if;
end $$;

select private.record_migration('0021', 'invoices');
