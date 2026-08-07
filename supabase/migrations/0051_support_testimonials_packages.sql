-- =============================================================================
-- 0051_support_testimonials_packages.sql
--
-- Support tickets, testimonials and pricing packages.
--
-- Testimonials and pricing packages were the last two entities the public site
-- rendered from hardcoded arrays. Both are moderated: nothing reaches a visitor
-- until somebody sets is_published.
--
-- SAFE TO RE-RUN. Requires 0038 (reference counters) and 0049.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
                 where n.nspname='public' and t.typname='ticket_status') then
    create type public.ticket_status as enum ('open','pending','resolved','closed');
  end if;
end $$;

create table if not exists public.support_tickets (
  id              uuid primary key default gen_random_uuid(),
  reference       text,
  subject         text not null check (length(btrim(subject)) between 3 and 200),
  body            text not null default '',
  status          public.ticket_status not null default 'open',
  priority        text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  opened_by       uuid references public.profiles (id) on delete set null,
  organization_id uuid references public.organizations (id) on delete set null,
  assignee_id     uuid references public.profiles (id) on delete set null,
  project_id      uuid references public.projects (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  constraint support_tickets_resolved_when_done check (
    (status in ('resolved','closed') and resolved_at is not null)
    or (status not in ('resolved','closed') and resolved_at is null))
);

create table if not exists public.support_ticket_replies (
  id          uuid primary key default gen_random_uuid(),
  ticket_id   uuid not null references public.support_tickets (id) on delete cascade,
  author_id   uuid references public.profiles (id) on delete set null,
  body        text not null check (length(btrim(body)) > 0),
  -- Staff can leave a note the person who opened the ticket never sees.
  is_internal boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.testimonials (
  id              uuid primary key default gen_random_uuid(),
  author_name     text not null check (length(btrim(author_name)) between 2 and 120),
  author_role     text,
  organization_id uuid references public.organizations (id) on delete set null,
  quote           text not null check (length(btrim(quote)) > 10),
  rating          int check (rating is null or rating between 1 and 5),
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create table if not exists public.pricing_packages (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(btrim(name)) between 2 and 120),
  slug            text not null unique,
  blurb           text,
  price_amount    numeric(12,2) check (price_amount is null or price_amount >= 0),
  currency        char(3) not null default 'USD',
  -- Null when the price is bespoke, rather than a zero that reads as free.
  price_period    text check (price_period is null or price_period in ('month','project','day','hour')),
  model           text not null default 'Project'
                  check (model in ('Retainer','Project','Advisory','Performance')),
  category        text,
  features        jsonb not null default '[]'::jsonb,
  service_page_id uuid references public.pages (id) on delete set null,
  is_published    boolean not null default false,
  is_featured     boolean not null default false,
  display_order   int not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint pricing_packages_features_is_array check (jsonb_typeof(features) = 'array')
);

create index if not exists support_tickets_status_idx   on public.support_tickets (status, created_at desc);
create index if not exists support_tickets_opener_idx   on public.support_tickets (opened_by);
create index if not exists support_tickets_org_idx      on public.support_tickets (organization_id);
create index if not exists support_tickets_assignee_idx on public.support_tickets (assignee_id);
create index if not exists support_tickets_project_idx  on public.support_tickets (project_id);
create index if not exists support_ticket_replies_ticket_idx on public.support_ticket_replies (ticket_id, created_at);
create index if not exists support_ticket_replies_author_idx on public.support_ticket_replies (author_id);
create index if not exists testimonials_org_idx         on public.testimonials (organization_id);
create index if not exists testimonials_published_idx   on public.testimonials (is_published, display_order);
create index if not exists pricing_packages_published_idx on public.pricing_packages (is_published, display_order);
create index if not exists pricing_packages_service_idx   on public.pricing_packages (service_page_id);

create unique index if not exists support_tickets_reference_key on public.support_tickets (reference);

do $$
declare t text;
begin
  foreach t in array array['support_tickets','testimonials','pricing_packages'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I
                    for each row execute function private.set_updated_at()', t, t);
  end loop;
end $$;

-- Reuses the monotonic counter from 0038 rather than inventing a second
-- numbering scheme that would drift from it.
create or replace function private.assign_ticket_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_prefix text := 'TKT-' || to_char(now(), 'YYYY');
  v_seq    int;
begin
  if new.reference is not null and btrim(new.reference) <> '' then return new; end if;

  insert into private.reference_counters (prefix, next_value) values (v_prefix, 2)
  on conflict (prefix) do update set next_value = private.reference_counters.next_value + 1
  returning case when xmax = 0 then 1 else private.reference_counters.next_value - 1 end into v_seq;

  new.reference := v_prefix || '-' || lpad(v_seq::text, 6, '0');
  return new;
end $$;

drop trigger if exists support_tickets_assign_reference on public.support_tickets;
create trigger support_tickets_assign_reference before insert on public.support_tickets
  for each row execute function private.assign_ticket_reference();

alter table public.support_tickets        enable row level security;
alter table public.support_ticket_replies enable row level security;
alter table public.testimonials           enable row level security;
alter table public.pricing_packages       enable row level security;

drop policy if exists support_tickets_select on public.support_tickets;
create policy support_tickets_select on public.support_tickets for select to authenticated
  using (opened_by = auth.uid() or assignee_id = auth.uid()
         or private.is_admin() or private.current_portal() = 'STAFF');
-- A new ticket always starts unassigned and open, so a crafted POST cannot
-- plant a pre-resolved ticket or assign work to somebody.
drop policy if exists support_tickets_insert on public.support_tickets;
create policy support_tickets_insert on public.support_tickets for insert to authenticated
  with check (opened_by = auth.uid() and status = 'open'
              and assignee_id is null and resolved_at is null);
drop policy if exists support_tickets_update on public.support_tickets;
create policy support_tickets_update on public.support_tickets for update to authenticated
  using (private.is_admin() or private.current_portal() = 'STAFF')
  with check (private.is_admin() or private.current_portal() = 'STAFF');
drop policy if exists support_tickets_delete on public.support_tickets;
create policy support_tickets_delete on public.support_tickets for delete to authenticated
  using (private.is_admin());

-- An internal note is invisible to the person who opened the ticket.
drop policy if exists support_ticket_replies_select on public.support_ticket_replies;
create policy support_ticket_replies_select on public.support_ticket_replies for select to authenticated
  using ((private.is_admin() or private.current_portal() = 'STAFF')
         or (is_internal = false and exists (
               select 1 from public.support_tickets t
               where t.id = ticket_id and t.opened_by = auth.uid())));
drop policy if exists support_ticket_replies_insert on public.support_ticket_replies;
create policy support_ticket_replies_insert on public.support_ticket_replies for insert to authenticated
  with check (author_id = auth.uid()
              and (private.is_admin() or private.current_portal() = 'STAFF'
                   or (is_internal = false and exists (
                         select 1 from public.support_tickets t
                         where t.id = ticket_id and t.opened_by = auth.uid()))));
drop policy if exists support_ticket_replies_delete on public.support_ticket_replies;
create policy support_ticket_replies_delete on public.support_ticket_replies for delete to authenticated
  using (private.is_admin());

drop policy if exists testimonials_select_public on public.testimonials;
create policy testimonials_select_public on public.testimonials for select to anon, authenticated
  using (is_published or private.can_edit_content() or private.is_admin());
drop policy if exists testimonials_write on public.testimonials;
create policy testimonials_write on public.testimonials for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());
drop policy if exists testimonials_update on public.testimonials;
create policy testimonials_update on public.testimonials for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());
drop policy if exists testimonials_delete on public.testimonials;
create policy testimonials_delete on public.testimonials for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

drop policy if exists pricing_packages_select_public on public.pricing_packages;
create policy pricing_packages_select_public on public.pricing_packages for select to anon, authenticated
  using (is_published or private.can_edit_content() or private.is_admin());
drop policy if exists pricing_packages_write on public.pricing_packages;
create policy pricing_packages_write on public.pricing_packages for insert to authenticated
  with check (private.can_edit_content() or private.is_admin());
drop policy if exists pricing_packages_update on public.pricing_packages;
create policy pricing_packages_update on public.pricing_packages for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());
drop policy if exists pricing_packages_delete on public.pricing_packages;
create policy pricing_packages_delete on public.pricing_packages for delete to authenticated
  using (private.can_edit_content() or private.is_admin());

do $$
declare t text;
begin
  foreach t in array array['support_tickets','support_ticket_replies','testimonials','pricing_packages'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

-- NOTE: 0054 rewrites every auth.uid() above as (select auth.uid()).

select private.record_migration('0051', 'support_testimonials_packages');
