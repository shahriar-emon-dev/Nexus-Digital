-- =============================================================================
-- 0027_seo_keywords.sql
--
-- Keyword tracking.
--
-- The Keywords screen listed ten targets with volumes, difficulty scores and
-- positions, all hardcoded in the page. A keyword target list is genuinely
-- agency-owned data, so it gets a table.
--
-- Impressions, clicks and CTR are deliberately NOT here. Those belong to
-- Search Console; inventing them is exactly what the previous screen did, and
-- a fabricated "+46.2% clicks" is the kind of figure that ends up in a client
-- report.
--
-- SAFE TO RE-RUN. Requires 0012_pages_and_versions.sql.
-- =============================================================================

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'keyword_intent') then
    create type public.keyword_intent as enum
      ('informational','commercial','transactional','navigational');
  end if;
end $$;

create table if not exists public.seo_keywords (
  id            uuid primary key default gen_random_uuid(),
  term          text not null check (length(btrim(term)) between 2 and 200),
  intent        public.keyword_intent not null default 'informational',
  -- Volume and difficulty come from a research tool. Nullable, because "not
  -- looked up yet" is a real state and zero is not the same thing.
  search_volume integer check (search_volume >= 0),
  difficulty    smallint check (difficulty between 0 and 100),
  target_url    text,
  page_id       uuid references public.pages (id) on delete set null,
  notes         text,
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.seo_keywords is
  'Keyword targets the agency tracks. Volume and difficulty are nullable '
  'because "not researched yet" is a real state that zero would misrepresent.';

create unique index if not exists seo_keywords_term_key on public.seo_keywords (lower(btrim(term)));
create index if not exists seo_keywords_page_idx on public.seo_keywords (page_id);

drop trigger if exists seo_keywords_set_updated_at on public.seo_keywords;
create trigger seo_keywords_set_updated_at before update on public.seo_keywords
  for each row execute function private.set_updated_at();

create table if not exists public.keyword_rankings (
  id          uuid primary key default gen_random_uuid(),
  keyword_id  uuid not null references public.seo_keywords (id) on delete cascade,
  position    smallint not null check (position between 1 and 200),
  recorded_on date not null default current_date,
  source      text not null default 'manual',
  created_at  timestamptz not null default now()
);

comment on table public.keyword_rankings is
  'Position snapshots over time. Movement is the difference between two of '
  'these, never a stored delta that can go stale.';

create unique index if not exists keyword_rankings_unique
  on public.keyword_rankings (keyword_id, recorded_on);
create index if not exists keyword_rankings_recent_idx
  on public.keyword_rankings (keyword_id, recorded_on desc);

alter table public.seo_keywords     enable row level security;
alter table public.keyword_rankings enable row level security;

drop policy if exists seo_keywords_select     on public.seo_keywords;
drop policy if exists seo_keywords_write      on public.seo_keywords;
drop policy if exists keyword_rankings_select on public.keyword_rankings;
drop policy if exists keyword_rankings_write  on public.keyword_rankings;

create policy seo_keywords_select on public.seo_keywords
  for select to authenticated using (private.can_edit_content() or private.is_admin());
create policy seo_keywords_write on public.seo_keywords
  for all to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());

create policy keyword_rankings_select on public.keyword_rankings
  for select to authenticated using (private.can_edit_content() or private.is_admin());
create policy keyword_rankings_write on public.keyword_rankings
  for all to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());

/**
 * Current position and movement, derived from the two most recent snapshots.
 *
 * A stored "change" column is wrong the moment a newer snapshot lands and
 * nobody recomputes it. This computes it on read, so it cannot go stale.
 */
create or replace view public.keyword_positions
with (security_invoker = true) as
with ranked as (
  select
    r.keyword_id,
    r.position,
    r.recorded_on,
    row_number() over (partition by r.keyword_id order by r.recorded_on desc) as rn
  from public.keyword_rankings r
)
select
  k.id                     as keyword_id,
  current_rank.position    as current_position,
  current_rank.recorded_on as measured_on,
  previous_rank.position   as previous_position,
  -- Positive means improved: rank 8 to rank 3 is +5, which reads the way a
  -- person expects even though the number itself went down.
  case
    when current_rank.position is not null and previous_rank.position is not null
      then previous_rank.position - current_rank.position
    else null
  end                      as movement
from public.seo_keywords k
left join ranked current_rank  on current_rank.keyword_id  = k.id and current_rank.rn  = 1
left join ranked previous_rank on previous_rank.keyword_id = k.id and previous_rank.rn = 2;

comment on view public.keyword_positions is
  'Latest position and movement between the two most recent snapshots. '
  'Movement is positive when the ranking improved.';

do $$
declare t text;
begin
  foreach t in array array['seo_keywords','keyword_rankings'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

select private.record_migration('0027', 'seo_keywords');
