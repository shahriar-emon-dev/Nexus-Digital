-- =============================================================================
-- 0038_project_reference_never_reused.sql
--
-- Fixes reference reuse introduced in 0037.
--
-- 0037 derived the next number from max() over EXISTING projects, and its own
-- comment claimed "deleting a project must never make the next one reuse a
-- retired reference". That is not what max() does: deleting the newest project
-- makes its number visible again. Proved by doing it — deleting PRJ-2026-0003
-- and inserting produced PRJ-2026-0003 a second time.
--
-- A reference that reappears on a different engagement is worse than an ugly
-- one: it makes two unrelated pieces of work indistinguishable in an email
-- thread, an invoice note or an audit entry.
--
-- Fixed with a counter table that only ever moves forward. The update is
-- atomic, so two concurrent inserts cannot take the same number either — which
-- max() also could not guarantee, since both would read the same maximum before
-- either wrote.
--
-- Verified after the change: deleting PRJ-2026-0003 and inserting twice
-- produced 0004 and 0005, leaving 0003 permanently retired.
--
-- SAFE TO RE-RUN. Requires 0037_service_delivery_history.sql.
-- =============================================================================

create table if not exists private.reference_counters (
  prefix     text primary key,
  next_value integer not null default 1
);

comment on table private.reference_counters is
  'Monotonic per-prefix counters. Lives in private: nothing should be able to '
  'rewind a reference sequence over the API.';

-- Seed each year past the highest reference already issued, so the fix cannot
-- collide with references that are already in circulation.
insert into private.reference_counters (prefix, next_value)
select 'PRJ-' || substring(reference from 5 for 4),
       max((regexp_replace(reference, '^PRJ-\d{4}-', ''))::int) + 1
  from public.projects
 where reference ~ '^PRJ-\d{4}-\d+$'
 group by substring(reference from 5 for 4)
on conflict (prefix) do update
  set next_value = greatest(private.reference_counters.next_value, excluded.next_value);

create or replace function private.assign_project_reference()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_prefix text := 'PRJ-' || to_char(now(), 'YYYY');
  v_seq    int;
begin
  if new.reference is not null and btrim(new.reference) <> '' then
    return new;
  end if;

  -- One atomic statement: claims the number and advances the counter together,
  -- so concurrent inserts serialise on this row instead of racing. `xmax = 0`
  -- distinguishes the insert path (first project of the year) from the update
  -- path, which has already incremented past the value being claimed.
  insert into private.reference_counters (prefix, next_value)
  values (v_prefix, 2)
  on conflict (prefix) do update
    set next_value = private.reference_counters.next_value + 1
  returning case when xmax = 0 then 1 else private.reference_counters.next_value - 1 end
    into v_seq;

  new.reference := v_prefix || '-' || lpad(v_seq::text, 4, '0');
  return new;
end $$;

select private.record_migration('0038', 'project_reference_never_reused');
