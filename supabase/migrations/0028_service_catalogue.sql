-- =============================================================================
-- 0028_service_catalogue.sql
--
-- Catalogue metadata for service pages.
--
-- There were two independent service management systems: /admin/services with
-- its own hardcoded catalogue of eight services, and /admin/content/services
-- backed by the page engine. Two screens, two shapes, one concept — and no way
-- to tell which one a published service page actually came from.
--
-- This merges them onto one source of truth. A service IS a page; this table
-- carries only the catalogue-level fields a page does not have. Its primary
-- key IS the page id, so a service cannot exist without its page and deleting
-- the page takes the catalogue entry with it.
--
-- SAFE TO RE-RUN. Requires 0016_service_pages.sql.
-- =============================================================================

create table if not exists public.service_details (
  page_id          uuid primary key references public.pages (id) on delete cascade,
  category         text not null default 'Engineering',
  -- Nullable: "we have not priced this yet" is a real state, and a 0 would
  -- advertise the service as free.
  price_from       numeric(12,2) check (price_from is null or price_from >= 0),
  currency         char(3) not null default 'USD',
  lead_time_weeks  smallint check (lead_time_weeks is null or lead_time_weeks between 0 and 260),
  summary          text,
  is_featured      boolean not null default false,
  display_order    integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.service_details is
  'Catalogue fields for a service page. The page owns the content, the slug '
  'and the publish state; this owns only price, category and lead time.';

create index if not exists service_details_category_idx on public.service_details (category);

drop trigger if exists service_details_set_updated_at on public.service_details;
create trigger service_details_set_updated_at before update on public.service_details
  for each row execute function private.set_updated_at();

alter table public.service_details enable row level security;

drop policy if exists service_details_select_public on public.service_details;
drop policy if exists service_details_write         on public.service_details;

-- Readable by anyone, because the public services page renders these prices.
-- Which services are visible is still decided by the page's own publish state.
create policy service_details_select_public on public.service_details
  for select to anon, authenticated using (true);
create policy service_details_write on public.service_details
  for all to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());

-- Backfill an entry for every existing service page, so the catalogue is not
-- empty for services that already exist.
insert into public.service_details (page_id)
select p.id from public.pages p
where p.page_type = 'service'
on conflict (page_id) do nothing;

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
    and schemaname = 'public' and tablename = 'service_details') then
    alter publication supabase_realtime add table public.service_details;
  end if;
end $$;

select private.record_migration('0028', 'service_catalogue');
