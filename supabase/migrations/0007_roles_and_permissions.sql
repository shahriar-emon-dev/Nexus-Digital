-- =============================================================================
-- 0007_roles_and_permissions.sql
--
-- Feature 3 — Roles & Permissions.
--
-- Moves the permission matrix, the module catalogue and the security policy out
-- of lib/access-control.ts. The Access Control console and the route guard then
-- read the same rows instead of the same file, which is the point: a grant
-- edited in the console must gate navigation immediately, without a deploy.
--
-- The access_level enum is declared in ASCENDING privilege order, so Postgres
-- compares it natively — `level >= 'view'` is the whole authorisation check.
-- No rank table, no CASE ladder, and an accidental reordering becomes a
-- migration rather than a silent privilege change.
--
-- SAFE TO RE-RUN. Requires 0001_authentication.sql.
-- =============================================================================

do $$
begin
  if not exists (
    select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
     where n.nspname = 'public' and t.typname = 'access_level'
  ) then
    create type public.access_level as enum ('none','audit','view','edit','admin','full');
  end if;
end $$;

-- --------------------------------------------------- permission modules ----

create table if not exists public.permission_modules (
  id            text primary key,
  label         text not null,
  description   text not null default '',
  -- Modules holding regulated or personal data are flagged in the matrix.
  sensitive     boolean not null default false,
  display_order int not null default 0,
  created_at    timestamptz not null default now()
);

comment on table public.permission_modules is
  'Resources a grant can be issued against. One row per governed area of the product.';

-- ------------------------------------------------------------- grants ----

create table if not exists public.role_grants (
  role_id    text not null references public.roles (id) on delete cascade,
  module_id  text not null references public.permission_modules (id) on delete cascade,
  level      public.access_level not null default 'none',
  updated_at timestamptz not null default now(),
  primary key (role_id, module_id)
);

comment on table public.role_grants is
  'The permission matrix. A missing row means no access, but every cell is '
  'written explicitly — an implicit denial gets misread during a security review.';

create index if not exists role_grants_module_idx on public.role_grants (module_id);

drop trigger if exists role_grants_set_updated_at on public.role_grants;
create trigger role_grants_set_updated_at
  before update on public.role_grants
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------- security policies ----
-- Single row. The `id boolean primary key default true check (id)` idiom makes
-- a second row impossible at the schema level, so no application code has to
-- remember there is only ever one.

create table if not exists public.security_policies (
  id                      boolean primary key default true check (id),
  totp_enforcement        text not null default 'mandatory'
                            check (totp_enforcement in ('mandatory','optional')),
  session_timeout_minutes int  not null default 30
                            check (session_timeout_minutes between 5 and 1440),
  password_rules          jsonb not null default '[]'::jsonb,
  ip_allow_list           text[] not null default '{}',
  geo_fencing_enabled     boolean not null default true,
  geo_regions             text[] not null default '{}',
  updated_at              timestamptz not null default now(),
  updated_by              uuid references public.profiles (id) on delete set null
);

comment on table public.security_policies is
  'Singleton row holding authentication and network policy for the whole tenant.';

drop trigger if exists security_policies_set_updated_at on public.security_policies;
create trigger security_policies_set_updated_at
  before update on public.security_policies
  for each row execute function private.set_updated_at();

create table if not exists public.isolation_policies (
  id          text primary key,
  label       text not null,
  description text not null default '',
  enabled     boolean not null default false,
  module_id   text references public.permission_modules (id) on delete cascade,
  tone        text not null default 'brand' check (tone in ('brand','ion')),
  updated_at  timestamptz not null default now()
);

drop trigger if exists isolation_policies_set_updated_at on public.isolation_policies;
create trigger isolation_policies_set_updated_at
  before update on public.isolation_policies
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------- RLS ----

alter table public.permission_modules enable row level security;
alter table public.role_grants        enable row level security;
alter table public.security_policies  enable row level security;
alter table public.isolation_policies enable row level security;

drop policy if exists permission_modules_select        on public.permission_modules;
drop policy if exists permission_modules_insert_admin  on public.permission_modules;
drop policy if exists permission_modules_update_admin  on public.permission_modules;
drop policy if exists permission_modules_delete_admin  on public.permission_modules;

-- Readable by any signed-in user: the route guard resolves a grant on every
-- gated request, and the matrix is not itself a secret. Writes are admin-only.
create policy permission_modules_select on public.permission_modules
  for select to authenticated using (true);
create policy permission_modules_insert_admin on public.permission_modules
  for insert to authenticated with check (private.is_admin());
create policy permission_modules_update_admin on public.permission_modules
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy permission_modules_delete_admin on public.permission_modules
  for delete to authenticated using (private.is_admin());

drop policy if exists role_grants_select       on public.role_grants;
drop policy if exists role_grants_insert_admin on public.role_grants;
drop policy if exists role_grants_update_admin on public.role_grants;
drop policy if exists role_grants_delete_admin on public.role_grants;

create policy role_grants_select on public.role_grants
  for select to authenticated using (true);
create policy role_grants_insert_admin on public.role_grants
  for insert to authenticated with check (private.is_admin());
create policy role_grants_update_admin on public.role_grants
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy role_grants_delete_admin on public.role_grants
  for delete to authenticated using (private.is_admin());

-- The IP allow-list is an attacker's shopping list, so unlike the matrix these
-- two are admin-read as well as admin-write.
drop policy if exists security_policies_select_admin on public.security_policies;
drop policy if exists security_policies_write_admin  on public.security_policies;
drop policy if exists security_policies_update_admin on public.security_policies;

create policy security_policies_select_admin on public.security_policies
  for select to authenticated using (private.is_admin());
create policy security_policies_update_admin on public.security_policies
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

drop policy if exists isolation_policies_select_admin on public.isolation_policies;
drop policy if exists isolation_policies_update_admin on public.isolation_policies;

create policy isolation_policies_select_admin on public.isolation_policies
  for select to authenticated using (private.is_admin());
create policy isolation_policies_update_admin on public.isolation_policies
  for update to authenticated using (private.is_admin()) with check (private.is_admin());

-- ------------------------------------------------------------- realtime ----

do $$
begin
  if not exists (select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='role_grants') then
    alter publication supabase_realtime add table public.role_grants;
  end if;
end $$;

-- ------------------------------------------------------------------ seed ---
-- Migrated from lib/access-control.ts. Reference data: the route guard and the
-- console both resolve against these rows.

insert into public.permission_modules (id, label, description, sensitive, display_order) values
  ('service-management','Service Management','Service catalogue, packages and published pricing.',false,1),
  ('financial-systems','Financial Systems','Invoices, payments, tax reporting and revenue.',true,2),
  ('crm-database','CRM Database','Client organisations, contacts and engagement history.',true,3),
  ('staff-hr-records','Staff & HR Records','Employment records, compensation and performance.',true,4),
  ('security-policies','Security Policies','This console, API credentials and the audit trail.',true,5),
  ('content-publishing','Content & Publishing','Blog, landing pages, case studies and site metadata.',false,6)
on conflict (id) do update
  set label = excluded.label,
      description = excluded.description,
      sensitive = excluded.sensitive,
      display_order = excluded.display_order;

insert into public.role_grants (role_id, module_id, level) values
  ('senior-specialist','service-management','edit'),
  ('senior-specialist','financial-systems','none'),
  ('senior-specialist','crm-database','edit'),
  ('senior-specialist','staff-hr-records','none'),
  ('senior-specialist','security-policies','none'),
  ('senior-specialist','content-publishing','edit'),
  ('project-lead','service-management','admin'),
  ('project-lead','financial-systems','view'),
  ('project-lead','crm-database','edit'),
  ('project-lead','staff-hr-records','edit'),
  ('project-lead','security-policies','none'),
  ('project-lead','content-publishing','admin'),
  ('financial-auditor','service-management','none'),
  ('financial-auditor','financial-systems','admin'),
  ('financial-auditor','crm-database','view'),
  ('financial-auditor','staff-hr-records','none'),
  ('financial-auditor','security-policies','audit'),
  ('financial-auditor','content-publishing','none'),
  ('global-admin','service-management','full'),
  ('global-admin','financial-systems','full'),
  ('global-admin','crm-database','full'),
  ('global-admin','staff-hr-records','full'),
  ('global-admin','security-policies','full'),
  ('global-admin','content-publishing','full')
on conflict (role_id, module_id) do nothing;

insert into public.security_policies (id, totp_enforcement, session_timeout_minutes, password_rules,
                                      ip_allow_list, geo_fencing_enabled, geo_regions)
values (true, 'mandatory', 30,
  '[{"id":"length","label":"Minimum 12 characters","enabled":true,"locked":true},
    {"id":"special","label":"Special character required","enabled":true,"locked":true},
    {"id":"numeric","label":"Numeric character required","enabled":true,"locked":false},
    {"id":"reuse","label":"Block reuse of last 5 passwords","enabled":true,"locked":false},
    {"id":"rotation","label":"Force rotation every 90 days","enabled":false,"locked":false}]'::jsonb,
  array['192.168.1.0/24','10.0.0.1 - 10.0.0.255','203.0.113.0/28'],
  true, array['Germany','United Kingdom','France'])
on conflict (id) do nothing;

insert into public.isolation_policies (id, label, description, enabled, module_id, tone) values
  ('billing-isolation','Billing Isolation','Hide financial records from everyone below auditor grant.',true,'financial-systems','brand'),
  ('crm-restrictions','CRM Restrictions','Limit client records to the assigned account manager.',false,'crm-database','ion'),
  ('hr-confidentiality','HR Confidentiality','Compensation fields visible to Global Admin only.',true,'staff-hr-records','ion'),
  ('content-embargo','Publishing Embargo','Require a second approval before anything goes live.',false,'content-publishing','brand')
on conflict (id) do nothing;

select private.record_migration('0007', 'roles_and_permissions');
