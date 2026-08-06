-- =============================================================================
-- 0034_role_tiers_and_capabilities.sql
--
-- Role tiers and the capability catalogue behind the Access Control redesign.
--
-- THE DECISION THAT SHAPES THIS FILE: the design shows a matrix of named
-- capabilities with a checkbox per role. The obvious schema for that is
-- `role_capabilities(role_id, capability_id, allowed boolean)` — and it would
-- have been wrong. Nothing in this database reads such a table: RLS,
-- private.is_admin(), can_edit_content() and the route guards all resolve
-- against role_grants. A per-capability boolean would have produced a console
-- where unticking "View financials" changed precisely nothing while looking
-- like it had revoked access.
--
-- So `capabilities` is a CATALOGUE. Each row declares what a named action
-- requires — a module and a minimum grant on it — and whether a role holds it
-- is derived by the role_capabilities VIEW from role_grants. Ticking a
-- capability means raising the underlying module grant, which is the thing that
-- is actually enforced.
--
-- The consequence, stated plainly: capabilities sharing a module move together.
-- Granting "Record and void invoices" also grants "View financials", because
-- both are financial-systems and the first requires the higher level. That is a
-- real semantic difference from the mockup's independent checkboxes, and it is
-- the price of the matrix telling the truth.
--
-- SAFE TO RE-RUN. Requires 0007_roles_and_permissions.sql.
-- =============================================================================

alter table public.roles
  add column if not exists level smallint check (level between 1 and 5),
  add column if not exists tags text[] not null default '{}',
  add column if not exists required_skills text[] not null default '{}',
  add column if not exists required_clearance smallint check (required_clearance between 1 and 5),
  add column if not exists accent text;

comment on column public.roles.level is
  'Clearance tier 1-5 shown on the role card. Presentation and ordering only — '
  'authorisation is decided by role_grants, never by this number.';

-- Guarded with `where level is null` so re-running never overwrites tiers an
-- administrator has since changed.
update public.roles set level = 5, tags = array['Full Admin','Security'],  required_clearance = 5 where id = 'global-admin'      and level is null;
update public.roles set level = 4, tags = array['Financials','Audit'],     required_clearance = 4 where id = 'financial-auditor' and level is null;
update public.roles set level = 3, tags = array['Delivery','Client Mgmt'], required_clearance = 3 where id = 'project-lead'      and level is null;
update public.roles set level = 2, tags = array['Delivery','Content'],     required_clearance = 2 where id = 'senior-specialist' and level is null;

create table if not exists public.capabilities (
  id             text primary key,
  label          text not null,
  description    text not null default '',
  module_id      text not null references public.permission_modules (id) on delete cascade,
  minimum_level  public.access_level not null,
  is_high_risk   boolean not null default false,
  display_order  integer not null default 0,
  created_at     timestamptz not null default now()
);

comment on table public.capabilities is
  'Named actions mapped to the module grant that authorises them. Derived, '
  'never a second source of truth.';

create index if not exists capabilities_module_idx on public.capabilities (module_id);

alter table public.capabilities enable row level security;
drop policy if exists capabilities_select on public.capabilities;
drop policy if exists capabilities_write  on public.capabilities;
drop policy if exists capabilities_insert on public.capabilities;
drop policy if exists capabilities_update on public.capabilities;
drop policy if exists capabilities_delete on public.capabilities;

create policy capabilities_select on public.capabilities
  for select to authenticated using (true);
create policy capabilities_insert on public.capabilities
  for insert to authenticated with check (private.is_admin());
create policy capabilities_update on public.capabilities
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy capabilities_delete on public.capabilities
  for delete to authenticated using (private.is_admin());

-- Seeded only with actions this application actually enforces. The design also
-- listed "Deploy to Production"; nothing in this system deploys anything, so
-- adding it would have invented a control that does nothing — the same defect
-- as a hardcoded metric, wearing a checkbox.
insert into public.capabilities (id, label, description, module_id, minimum_level, is_high_risk, display_order) values
  ('finance.view',    'View financials',          'Access to invoices, payments and outstanding balances.',  'financial-systems',  'view',  false, 1),
  ('finance.manage',  'Record and void invoices', 'Take payments, void invoices and change billing records.','financial-systems',  'admin', true,  2),
  ('crm.view',        'View client records',      'Read the client directory and engagement history.',       'crm-database',       'view',  false, 3),
  ('crm.manage',      'Manage client records',    'Create, edit and retire client accounts.',                'crm-database',       'edit',  false, 4),
  ('content.publish', 'Publish content',          'Push pages, services and posts live on the public site.', 'content-publishing', 'edit',  false, 5),
  ('services.manage', 'Manage the catalogue',     'Change published services, pricing and lead times.',      'service-management', 'edit',  false, 6),
  ('staff.manage',    'Manage staff records',     'Edit the roster, capacity and public profiles.',          'staff-hr-records',   'edit',  false, 7),
  ('security.audit',  'Read the audit trail',     'View the immutable record of privileged actions.',        'security-policies',  'audit', false, 8),
  ('security.access', 'Assign portals and roles', 'Change who can reach which portal and at what grant.',    'security-policies',  'admin', true,  9),
  ('security.keys',   'Manage API credentials',   'Register, rotate and retire third-party keys.',           'security-policies',  'admin', true,  10)
on conflict (id) do update set
  label         = excluded.label,
  description   = excluded.description,
  module_id     = excluded.module_id,
  minimum_level = excluded.minimum_level,
  is_high_risk  = excluded.is_high_risk,
  display_order = excluded.display_order;

/**
 * The capability matrix, computed rather than stored.
 *
 * `granted` compares the role's actual grant against what the capability
 * requires, using the same ordered enum RLS compares — so the matrix cannot
 * disagree with what the database will actually allow.
 */
create or replace view public.role_capabilities
with (security_invoker = true) as
select
  r.id                                         as role_id,
  c.id                                         as capability_id,
  c.module_id,
  c.minimum_level,
  c.is_high_risk,
  coalesce(g.level, 'none')                    as current_level,
  coalesce(g.level, 'none') >= c.minimum_level as granted
from public.roles r
cross join public.capabilities c
left join public.role_grants g
  on g.role_id = r.id and g.module_id = c.module_id;

comment on view public.role_capabilities is
  'Capability matrix derived from role_grants. Ticking a capability means '
  'raising the underlying module grant.';

select private.record_migration('0034', 'role_tiers_and_capabilities');
