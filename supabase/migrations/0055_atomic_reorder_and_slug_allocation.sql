-- =============================================================================
-- 0055_atomic_reorder_and_slug_allocation.sql
--
-- Two performance findings from the audit, both of which were also correctness
-- problems wearing a performance costume.
--
-- SAFE TO RE-RUN.
-- =============================================================================

-- PERF-01 ---------------------------------------------------------------------
-- Reordering looped in application code, issuing one UPDATE per row and
-- returning early on the first error. Dragging twenty menu items was twenty
-- round trips, and a failure on the eleventh left the ordering half applied
-- with no transaction to roll back. A function body is a single statement from
-- the caller's point of view, so this is atomic.
--
-- SECURITY INVOKER on purpose: the existing update policies must still decide
-- who may reorder. A definer here would hand reordering to everyone.

create or replace function public.reorder_menu_items(p_items jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.menu_items m
     set position  = (i ->> 'position')::int,
         parent_id = nullif(i ->> 'parent_id', '')::uuid
    from jsonb_array_elements(p_items) as i
   where m.id = (i ->> 'id')::uuid;
end $$;

comment on function public.reorder_menu_items is
  'Applies a whole ordering in one statement. Invoker rights, so the menu_items '
  'update policy still decides who may reorder.';

create or replace function public.reorder_services(p_page_ids uuid[])
returns void language plpgsql security invoker set search_path = '' as $$
begin
  update public.service_details s
     set display_order = o.ord - 1
    from unnest(p_page_ids) with ordinality as o(page_id, ord)
   where s.page_id = o.page_id;
end $$;

comment on function public.reorder_services is
  'Applies a whole ordering in one statement. Invoker rights, so the '
  'service_details update policy still decides who may reorder.';

-- PERF-02 ---------------------------------------------------------------------
-- Three creation paths found a free slug by polling: `for n in 2..50` with a
-- SELECT each time. Up to 48 sequential round trips on the happy path, and a
-- concurrent create still lost the race and surfaced as a raw constraint error.
--
-- The unique constraints (organizations_slug_key, projects_org_slug_key,
-- staff_profiles_slug_key, pages_slug_key) remain the thing that actually
-- guarantees uniqueness. This just stops the polling.
--
-- The table name is validated against a fixed list rather than interpolated
-- freely: format(%I) quotes an identifier but would still happily point this at
-- any table in the schema.

create or replace function public.next_available_slug(p_table text, p_base text)
returns text language plpgsql security invoker set search_path = '' as $$
declare
  v_taken text[];
  v_slug  text;
begin
  if p_table not in ('organizations', 'projects', 'staff_profiles', 'pages') then
    raise exception 'unknown table %', p_table using errcode = 'check_violation';
  end if;

  -- Only slugs sharing the base can collide, so this never scans the table.
  execute format(
    'select coalesce(array_agg(slug), ''{}'') from public.%I where slug = $1 or slug like $1 || ''-%%''',
    p_table)
    into v_taken using p_base;

  if not (p_base = any(v_taken)) then return p_base; end if;

  for i in 2..9999 loop
    v_slug := p_base || '-' || i;
    if not (v_slug = any(v_taken)) then return v_slug; end if;
  end loop;

  raise exception 'no free slug for %', p_base;
end $$;

grant execute on function public.reorder_menu_items(jsonb)       to authenticated;
grant execute on function public.reorder_services(uuid[])        to authenticated;
grant execute on function public.next_available_slug(text, text) to authenticated;

select private.record_migration('0055', 'atomic_reorder_and_slug_allocation');
