-- =============================================================================
-- 0000_migration_registry.sql
--
-- Registry of applied migrations.
--
-- Supabase keeps its own record in `supabase_migrations.schema_migrations`, but
-- that schema is only written when a migration is applied through the CLI or
-- the management API. Anything pasted into the SQL Editor bypasses it, so the
-- project needs a registry it controls.
--
-- Every migration in this directory records itself on success. Run this file
-- first; all later migrations depend on `private.record_migration`.
--
-- SAFE TO RE-RUN.
-- =============================================================================

create schema if not exists private;

create table if not exists public.schema_migrations (
  version     text primary key,
  name        text not null,
  applied_at  timestamptz not null default now(),
  applied_by  text not null default current_user
);

comment on table public.schema_migrations is
  'Registry of applied SQL migrations. Every migration records itself on success. '
  'Ordered by version; never edit rows by hand.';

-- The rls_auto_enable event trigger enables RLS on new public tables, so this
-- needs a policy or the table becomes unreadable through the API.
alter table public.schema_migrations enable row level security;

drop policy if exists schema_migrations_select_admin on public.schema_migrations;

-- Guarded: private.is_admin() does not exist until 0001 has run. On a first
-- run this file is applied before 0001, so the policy is created then.
do $$
begin
  if exists (
    select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'private' and p.proname = 'is_admin'
  ) then
    execute $p$
      create policy schema_migrations_select_admin on public.schema_migrations
        for select to authenticated
        using (private.is_admin())
    $p$;
  end if;
end $$;

-- Recorded once. Re-running a migration must not overwrite the timestamp of
-- the first successful application — that is the whole value of the audit row.
create or replace function private.record_migration(p_version text, p_name text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.schema_migrations (version, name)
  values (p_version, p_name)
  on conflict (version) do nothing;
$$;

revoke all on function private.record_migration(text, text) from public, anon, authenticated;

select private.record_migration('0000', 'migration_registry');
