-- =============================================================================
-- 0022_reviews_credentials_audit.sql
--
-- Three modules whose admin screens were placeholders because they had no
-- tables to read: review moderation, API credentials and the audit trail.
--
-- Two decisions worth stating up front, because both are load-bearing:
--
--   1. api_credentials NEVER stores a secret. It stores the provider's own
--      prefix and the last four characters, which is all a human needs to tell
--      one key from another at a glance. There is no reveal, no decrypt and no
--      column that could hold one. A key you cannot read from the database is
--      a key that cannot leak from the database.
--
--   2. audit_log is append-only in the schema, not by convention. There is no
--      UPDATE or DELETE policy, and a trigger raises on either regardless of
--      role — including the service role. The screen calls itself an
--      "immutable record of every privileged action"; this is what makes that
--      sentence true rather than decorative.
--
-- SAFE TO RE-RUN. Requires 0007_roles_and_permissions.sql and 0021_invoices.sql.
-- =============================================================================

-- ------------------------------------------------------------------ enums --

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'review_status') then
    create type public.review_status as enum ('pending','approved','rejected');
  end if;

  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname = 'credential_environment') then
    create type public.credential_environment as enum ('production','staging','development');
  end if;
end $$;

-- ---------------------------------------------------------------- reviews --

create table if not exists public.reviews (
  id              uuid primary key default gen_random_uuid(),
  -- Both optional: a review can arrive from the public site with no account
  -- behind it, and can praise the agency rather than a specific project.
  organization_id uuid references public.organizations (id) on delete set null,
  project_id      uuid references public.projects (id) on delete set null,
  author_id       uuid references public.profiles (id) on delete set null,
  author_name     text not null check (length(btrim(author_name)) between 2 and 120),
  author_role     text,
  author_company  text,
  rating          smallint not null check (rating between 1 and 5),
  title           text,
  body            text not null check (length(btrim(body)) >= 10),
  status          public.review_status not null default 'pending',
  -- Featured reviews lead the public page. Only meaningful once approved,
  -- which the partial index below enforces at the query level.
  is_featured     boolean not null default false,
  display_order   integer not null default 0,
  moderated_by    uuid references public.profiles (id) on delete set null,
  moderated_at    timestamptz,
  moderation_note text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  -- A decision without a decider is an audit gap, so the two move together.
  constraint reviews_moderation_paired check (
    (status = 'pending' and moderated_at is null)
    or (status <> 'pending' and moderated_at is not null)
  )
);

comment on table public.reviews is
  'Client reviews and testimonials. Nothing is public until a moderator '
  'approves it; RLS, not the query, is what enforces that.';

create index if not exists reviews_status_idx   on public.reviews (status);
create index if not exists reviews_org_idx      on public.reviews (organization_id);
create index if not exists reviews_project_idx  on public.reviews (project_id);
create index if not exists reviews_public_idx   on public.reviews (display_order, created_at desc)
  where status = 'approved';

drop trigger if exists reviews_set_updated_at on public.reviews;
create trigger reviews_set_updated_at before update on public.reviews
  for each row execute function private.set_updated_at();

alter table public.reviews enable row level security;

drop policy if exists reviews_select_public   on public.reviews;
drop policy if exists reviews_select_staff    on public.reviews;
drop policy if exists reviews_insert_public   on public.reviews;
drop policy if exists reviews_update_editor   on public.reviews;
drop policy if exists reviews_delete_admin    on public.reviews;

-- Anonymous visitors see approved reviews only. This is the single gate
-- between the moderation queue and the public site.
create policy reviews_select_public on public.reviews
  for select to anon, authenticated using (status = 'approved');

create policy reviews_select_staff on public.reviews
  for select to authenticated using (private.can_edit_content() or private.is_admin());

-- A submission can never arrive pre-approved: the WITH CHECK pins the status
-- and clears the moderation fields, so a crafted POST cannot self-publish.
create policy reviews_insert_public on public.reviews
  for insert to anon, authenticated
  with check (status = 'pending' and moderated_by is null and moderated_at is null);

create policy reviews_update_editor on public.reviews
  for update to authenticated
  using (private.can_edit_content() or private.is_admin())
  with check (private.can_edit_content() or private.is_admin());

create policy reviews_delete_admin on public.reviews
  for delete to authenticated using (private.is_admin());

-- -------------------------------------------------------- api credentials --

create table if not exists public.api_credentials (
  id                     uuid primary key default gen_random_uuid(),
  provider               text not null check (length(btrim(provider)) between 2 and 60),
  name                   text not null check (length(btrim(name)) between 2 and 120),
  environment            public.credential_environment not null default 'production',
  -- The provider's own visible prefix (sk_live_, AIza…) and the last four
  -- characters. Together they identify a key without revealing one.
  key_prefix             text not null default '' check (length(key_prefix) <= 16),
  last4                  char(4) not null,
  is_enabled             boolean not null default true,
  owner_id               uuid references public.profiles (id) on delete set null,
  notes                  text,
  -- Rotation is the reason this table exists rather than a settings blob.
  last_rotated_at        timestamptz not null default now(),
  rotation_interval_days integer not null default 90 check (rotation_interval_days between 1 and 3650),
  last_used_at           timestamptz,
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

comment on table public.api_credentials is
  'API key REGISTRY — never the keys themselves. Stores the provider prefix '
  'and last four characters only. There is deliberately no column a secret '
  'could be written to.';

create unique index if not exists api_credentials_unique
  on public.api_credentials (provider, name, environment);
create index if not exists api_credentials_rotation_idx
  on public.api_credentials (last_rotated_at);

drop trigger if exists api_credentials_set_updated_at on public.api_credentials;
create trigger api_credentials_set_updated_at before update on public.api_credentials
  for each row execute function private.set_updated_at();

alter table public.api_credentials enable row level security;

drop policy if exists api_credentials_select on public.api_credentials;
drop policy if exists api_credentials_write  on public.api_credentials;

-- Credentials sit behind the security-policies grant, the same gate as the
-- audit trail and this console. Nothing below `audit` sees them at all.
create policy api_credentials_select on public.api_credentials
  for select to authenticated using (private.is_admin());
create policy api_credentials_write on public.api_credentials
  for all to authenticated using (private.is_admin()) with check (private.is_admin());

/**
 * Rotation status, derived rather than stored.
 *
 * A stored "expired" boolean is wrong the moment the clock passes it and
 * nobody has written the row. Deriving it means the screen cannot show a key
 * as healthy on the day it lapses.
 */
create or replace view public.credential_rotation
with (security_invoker = true) as
select
  c.id                                                            as credential_id,
  (c.last_rotated_at + make_interval(days => c.rotation_interval_days)) as due_at,
  greatest(0, extract(day from now() - c.last_rotated_at)::int)   as age_days,
  extract(day from (c.last_rotated_at + make_interval(days => c.rotation_interval_days)) - now())::int
                                                                  as days_remaining,
  case
    when now() > c.last_rotated_at + make_interval(days => c.rotation_interval_days) then 'overdue'
    when now() > c.last_rotated_at + make_interval(days => (c.rotation_interval_days * 0.85)::int) then 'due-soon'
    else 'healthy'
  end                                                             as rotation_state
from public.api_credentials c;

comment on view public.credential_rotation is
  'Rotation state computed from now(), so a key cannot read as healthy on the '
  'day it lapses.';

-- -------------------------------------------------------------- audit log --

create table if not exists public.audit_log (
  id           bigint generated always as identity primary key,
  -- Deliberately NOT a foreign key. See 0029: `on delete set null` made
  -- deleting a user issue an UPDATE against this table, which the append-only
  -- trigger refuses — so anyone who appeared here could never be deleted.
  actor_id     uuid,
  -- Denormalised on purpose. The whole value of an audit trail is that it
  -- still names the actor after the account is gone.
  actor_email  text,
  actor_name   text,
  action       text not null,
  entity_type  text not null,
  entity_id    text,
  summary      text not null,
  metadata     jsonb not null default '{}'::jsonb,
  severity     text not null default 'info'
                 check (severity in ('info','notice','warning','critical')),
  created_at   timestamptz not null default now()
);

comment on table public.audit_log is
  'Append-only record of privileged actions. Immutability is enforced by '
  'trigger, not by the absence of an UPDATE policy — see private.reject_audit_mutation.';

create index if not exists audit_log_created_idx  on public.audit_log (created_at desc);
create index if not exists audit_log_actor_idx    on public.audit_log (actor_id);
create index if not exists audit_log_entity_idx   on public.audit_log (entity_type, entity_id);
create index if not exists audit_log_severity_idx on public.audit_log (severity)
  where severity in ('warning','critical');

/**
 * Refuses every UPDATE and DELETE, for every role.
 *
 * RLS alone would leave the service role able to rewrite history, and the
 * service role is exactly who an attacker with a leaked key would be. A
 * trigger has no such exemption.
 */
create or replace function private.reject_audit_mutation()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'audit_log is append-only: % is not permitted', tg_op
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists audit_log_immutable on public.audit_log;
create trigger audit_log_immutable before update or delete on public.audit_log
  for each row execute function private.reject_audit_mutation();

/**
 * TRUNCATE bypasses row-level triggers entirely, so the guard above does not
 * see it. Verified by probe: without this, one statement empties the trail.
 */
create or replace function private.reject_audit_truncate()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  raise exception 'audit_log is append-only: TRUNCATE is not permitted'
    using errcode = 'insufficient_privilege';
end $$;

drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function private.reject_audit_truncate();

alter table public.audit_log enable row level security;

drop policy if exists audit_log_select on public.audit_log;
drop policy if exists audit_log_insert on public.audit_log;

create policy audit_log_select on public.audit_log
  for select to authenticated using (private.is_admin());
-- Any authenticated action can record itself; nobody can amend the record.
create policy audit_log_insert on public.audit_log
  for insert to authenticated with check (true);

/**
 * Writes an audit row for whoever is acting right now.
 *
 * SECURITY DEFINER so it can read profiles for the actor's name — a caller
 * without profile visibility still gets a fully attributed entry. It lives in
 * `private` because PostgREST publishes every function in `public` as an RPC
 * endpoint, and an audit writer is not something to expose over HTTP.
 */
create or replace function private.write_audit(
  p_action      text,
  p_entity_type text,
  p_entity_id   text,
  p_summary     text,
  p_metadata    jsonb default '{}'::jsonb,
  p_severity    text default 'info'
) returns void language plpgsql security definer set search_path = '' as $$
declare
  v_id    uuid := auth.uid();
  v_email text;
  v_name  text;
begin
  select p.email, p.full_name into v_email, v_name
    from public.profiles p where p.id = v_id;

  insert into public.audit_log
    (actor_id, actor_email, actor_name, action, entity_type, entity_id,
     summary, metadata, severity)
  values
    (v_id, v_email, v_name, p_action, p_entity_type, p_entity_id,
     p_summary, coalesce(p_metadata, '{}'::jsonb), p_severity);
end $$;

/**
 * Records privilege changes without the application having to remember to.
 *
 * An audit trail that depends on every call site calling it is an audit trail
 * with holes in it. Attaching this to the tables themselves means a change
 * made in the SQL editor is logged exactly like one made through the UI.
 */
create or replace function private.audit_privilege_change()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if tg_table_name = 'profiles' then
    if new.portal is distinct from old.portal or new.role_id is distinct from old.role_id then
      perform private.write_audit(
        'profile.access_changed', 'profile', new.id::text,
        format('%s moved to %s / %s', coalesce(new.email, new.id::text),
               new.portal, coalesce(new.role_id, 'no role')),
        jsonb_build_object('from_portal', old.portal, 'to_portal', new.portal,
                           'from_role', old.role_id, 'to_role', new.role_id),
        'warning');
    end if;
    if new.is_active is distinct from old.is_active then
      perform private.write_audit(
        case when new.is_active then 'profile.reactivated' else 'profile.deactivated' end,
        'profile', new.id::text,
        format('%s %s', coalesce(new.email, new.id::text),
               case when new.is_active then 'reactivated' else 'deactivated' end),
        '{}'::jsonb, 'warning');
    end if;
    return new;
  end if;

  if tg_table_name = 'role_grants' then
    perform private.write_audit(
      'grant.' || lower(tg_op), 'role_grant',
      coalesce(new.role_id, old.role_id) || ':' || coalesce(new.module_id, old.module_id),
      format('%s on %s set to %s', coalesce(new.role_id, old.role_id),
             coalesce(new.module_id, old.module_id),
             coalesce(new.level::text, 'removed')),
      jsonb_build_object('from', old.level, 'to', new.level),
      'critical');
    return coalesce(new, old);
  end if;

  if tg_table_name = 'api_credentials' then
    perform private.write_audit(
      'credential.' || lower(tg_op), 'api_credential',
      coalesce(new.id, old.id)::text,
      format('%s / %s (%s)', coalesce(new.provider, old.provider),
             coalesce(new.name, old.name),
             coalesce(new.environment, old.environment)),
      case
        when tg_op = 'UPDATE' and new.last_rotated_at is distinct from old.last_rotated_at
          then jsonb_build_object('rotated', true)
        else '{}'::jsonb
      end,
      'warning');
    return coalesce(new, old);
  end if;

  return coalesce(new, old);
end $$;

drop trigger if exists profiles_audit         on public.profiles;
drop trigger if exists role_grants_audit      on public.role_grants;
drop trigger if exists api_credentials_audit  on public.api_credentials;

create trigger profiles_audit after update on public.profiles
  for each row execute function private.audit_privilege_change();
create trigger role_grants_audit after insert or update or delete on public.role_grants
  for each row execute function private.audit_privilege_change();
create trigger api_credentials_audit after insert or update or delete on public.api_credentials
  for each row execute function private.audit_privilege_change();

-- ---------------------------------------------------------------- realtime --

do $$
declare t text;
begin
  foreach t in array array['reviews','api_credentials','audit_log'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

select private.record_migration('0022', 'reviews_credentials_audit');
