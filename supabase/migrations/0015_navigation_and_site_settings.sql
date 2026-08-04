-- =============================================================================
-- 0015_navigation_and_site_settings.sql
--
-- CMS — navigation, menu locations and the site homepage assignment.
--
-- The public header and footer render a hardcoded list of links. This makes
-- site structure editable: menus hold items, items sit at a location, and the
-- root URL resolves whichever published page an administrator nominates.
--
-- The central decision is that a menu item pointing at a page stores the PAGE
-- ID, never the URL. The slug is resolved at render time, so renaming a page
-- cannot break navigation — the requirement that would otherwise force an
-- editor to hunt through menus after every rename.
--
-- SAFE TO RE-RUN. Requires 0012_pages_and_versions.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='menu_location') then
    create type public.menu_location as enum ('header','footer','mobile','utility');
  end if;
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid=t.typnamespace
    where n.nspname='public' and t.typname='menu_item_type') then
    create type public.menu_item_type as enum ('page','external','anchor');
  end if;
end $$;

-- ----------------------------------------------------------------- menus ----

create table if not exists public.menus (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  -- A location holds at most one menu, so the renderer never has to choose.
  location    public.menu_location,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint menus_name_length check (char_length(name) between 1 and 80)
);

comment on table public.menus is
  'A named list of navigation items. Assigning a location publishes it to that '
  'slot on the public site; an unassigned menu is a draft nobody sees.';

create unique index if not exists menus_location_key on public.menus (location)
  where location is not null;

drop trigger if exists menus_set_updated_at on public.menus;
create trigger menus_set_updated_at before update on public.menus
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------ menu items ----

create table if not exists public.menu_items (
  id           uuid primary key default gen_random_uuid(),
  menu_id      uuid not null references public.menus (id) on delete cascade,
  -- Self-reference gives one level of nesting (a dropdown) without a
  -- recursive CTE at render time.
  parent_id    uuid references public.menu_items (id) on delete cascade,
  label        text not null,
  item_type    public.menu_item_type not null default 'page',
  -- The whole point: a page reference, not a copy of its URL.
  page_id      uuid references public.pages (id) on delete cascade,
  external_url text,
  position     int not null default 0,
  is_visible   boolean not null default true,
  open_in_new_tab boolean not null default false,
  badge        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint menu_items_label_length check (char_length(label) between 1 and 80),
  -- Each type must carry exactly the field it needs and nothing else, so a
  -- half-configured item can never reach the renderer.
  constraint menu_items_target_present check (
    (item_type = 'page'     and page_id is not null and external_url is null)
    or (item_type = 'external' and external_url is not null and page_id is null)
    or (item_type = 'anchor'   and external_url is not null and page_id is null)
  )
);

comment on table public.menu_items is
  'Navigation entries. A page item stores page_id, never a URL, so renaming a '
  'page cannot break the menu — the slug is resolved when the menu renders.';

create index if not exists menu_items_menu_idx   on public.menu_items (menu_id, position);
create index if not exists menu_items_parent_idx on public.menu_items (parent_id);
create index if not exists menu_items_page_idx   on public.menu_items (page_id);

drop trigger if exists menu_items_set_updated_at on public.menu_items;
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function private.set_updated_at();

-- Nesting stops at one level: a dropdown inside a dropdown is a navigation
-- smell and doubles the rendering cases for no benefit here.
create or replace function private.guard_menu_depth()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.parent_id is not null and exists (
    select 1 from public.menu_items p
     where p.id = new.parent_id and p.parent_id is not null
  ) then
    raise exception 'navigation supports one level of nesting' using errcode = '22023';
  end if;
  if new.parent_id = new.id then
    raise exception 'a menu item cannot be its own parent' using errcode = '22023';
  end if;
  return new;
end;
$$;
revoke all on function private.guard_menu_depth() from public, anon, authenticated;

drop trigger if exists menu_items_guard_depth on public.menu_items;
create trigger menu_items_guard_depth
  before insert or update on public.menu_items
  for each row execute function private.guard_menu_depth();

-- --------------------------------------------------------- site settings ----

create table if not exists public.site_settings (
  id               boolean primary key default true,
  -- Which published page answers "/". Null falls back to the built-in
  -- marketing homepage, so the site is never blank.
  homepage_page_id uuid references public.pages (id) on delete set null,
  site_name        text not null default 'Nexus',
  updated_by       uuid references public.profiles (id) on delete set null,
  updated_at       timestamptz not null default now(),
  constraint site_settings_singleton check (id)
);

comment on table public.site_settings is
  'Single row. `id` is a boolean constrained to true, which is how Postgres '
  'enforces a singleton without application code.';

insert into public.site_settings (id) values (true) on conflict (id) do nothing;

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
  for each row execute function private.set_updated_at();

-- ------------------------------------------------------------------ RLS ----

alter table public.menus         enable row level security;
alter table public.menu_items    enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists menus_select        on public.menus;
drop policy if exists menus_insert_editor on public.menus;
drop policy if exists menus_update_editor on public.menus;
drop policy if exists menus_delete_editor on public.menus;

-- Readable by anon: the public header has to render it.
create policy menus_select on public.menus for select to anon, authenticated using (true);
create policy menus_insert_editor on public.menus for insert to authenticated
  with check (private.can_edit_content());
create policy menus_update_editor on public.menus for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy menus_delete_editor on public.menus for delete to authenticated
  using (private.can_edit_content());

drop policy if exists menu_items_select        on public.menu_items;
drop policy if exists menu_items_insert_editor on public.menu_items;
drop policy if exists menu_items_update_editor on public.menu_items;
drop policy if exists menu_items_delete_editor on public.menu_items;

create policy menu_items_select on public.menu_items for select to anon, authenticated using (true);
create policy menu_items_insert_editor on public.menu_items for insert to authenticated
  with check (private.can_edit_content());
create policy menu_items_update_editor on public.menu_items for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());
create policy menu_items_delete_editor on public.menu_items for delete to authenticated
  using (private.can_edit_content());

drop policy if exists site_settings_select        on public.site_settings;
drop policy if exists site_settings_update_editor on public.site_settings;

create policy site_settings_select on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_update_editor on public.site_settings
  for update to authenticated
  using (private.can_edit_content()) with check (private.can_edit_content());

-- ------------------------------------------------------ resolved menu view --
-- Joins each item to its page's CURRENT slug and drops anything the public
-- must not see: hidden items, and page items whose target is not published.
-- Doing this in one view means the renderer cannot forget either rule.

create or replace view public.resolved_menu_items
with (security_invoker = true) as
  select
    mi.id,
    mi.menu_id,
    m.location,
    mi.parent_id,
    mi.label,
    mi.item_type,
    mi.position,
    mi.open_in_new_tab,
    mi.badge,
    case
      when mi.item_type = 'page' then '/' || p.slug
      else mi.external_url
    end as href,
    mi.page_id
  from public.menu_items mi
  join public.menus m on m.id = mi.menu_id
  left join public.pages p on p.id = mi.page_id
 where mi.is_visible
   and (
     mi.item_type <> 'page'
     or (p.id is not null and p.status = 'published' and p.published_version_id is not null)
   );

comment on view public.resolved_menu_items is
  'Public-facing menu rows with hrefs resolved from the page''s current slug. '
  'Hidden items and items pointing at unpublished pages are excluded here, not '
  'in the renderer, so both rules are enforced in one place.';

select private.record_migration('0015', 'navigation_and_site_settings');
