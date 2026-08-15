-- =====================================================================
--  Row-Level Security regression suite
-- =====================================================================
--
--  WHY THIS EXISTS
--
--  Every authorisation decision in this application is a Postgres policy.
--  `middleware.ts` decides which *page* you may open; the policies decide
--  which *rows* you may read. Only the second one survives someone talking
--  to PostgREST directly with the anon key — which is published in the
--  browser bundle, by design.
--
--  The policies were reviewed by reading them. Reading is not proof. This
--  file exercises them the way an attacker would: as a real role, with a
--  real JWT subject, through the same code path the client library uses.
--
--  HOW IT WORKS
--
--  `set local role authenticated` + `set local request.jwt.claims` is
--  exactly what PostgREST does per request, so `auth.uid()` and every
--  `private.*` helper resolve as they do in production.
--
--  Everything runs inside ONE transaction that ends in ROLLBACK. Fixtures
--  are created and destroyed inside it; the suite is safe to run against
--  production and leaves nothing behind. Table owners bypass RLS, which is
--  why fixture setup runs as the session role and every assertion runs
--  after an explicit `set local role`.
--
--  RUN IT
--
--      psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/rls/rls.test.sql
--
--  A failing assertion aborts with P0004 and names the property that
--  broke. Silence plus "ALL RLS ASSERTIONS PASSED" is a pass.
--
--  Assertions are grouped by the property they defend, not by table, so a
--  failure tells you which guarantee is gone rather than which query broke.
-- =====================================================================

begin;

-- Assertions must be live; a suite that silently skips is worse than none.
set local plpgsql.check_asserts = on;

-- ------------------------------------------------------------------
--  Fixtures. Two organisations that must never see each other, one
--  client in each, two staff at different role levels, one admin.
-- ------------------------------------------------------------------

create temporary table t_ids (k text primary key, v uuid) on commit drop;

insert into t_ids (k, v) values
  ('org_a',   gen_random_uuid()),
  ('org_b',   gen_random_uuid()),
  ('client_a', gen_random_uuid()),
  ('client_b', gen_random_uuid()),
  ('staff_lo', gen_random_uuid()),   -- level 2, assignment-scoped
  ('staff_hi', gen_random_uuid()),   -- level 3, sees every project
  ('admin',    gen_random_uuid()),
  ('proj_a',   gen_random_uuid()),
  ('proj_b',   gen_random_uuid()),
  ('inv_a',    gen_random_uuid()),
  ('inv_a_draft', gen_random_uuid()),
  ('inv_b',    gen_random_uuid());

-- The assertions run as `authenticated` and `anon`, which have no rights on a
-- temp table created by the session role. Without these grants every lookup
-- fails with 42501 and the suite reports a permissions problem of its own
-- making rather than a policy failure.
grant select on t_ids to authenticated, anon;

create or replace function pg_temp.id(text) returns uuid language sql stable as
$$ select v from t_ids where k = $1 $$;

grant execute on function pg_temp.id(text) to authenticated, anon;

create or replace function pg_temp.become(p_user uuid) returns void language plpgsql as $$
begin
  execute 'set local role authenticated';
  execute format(
    'set local request.jwt.claims = %L',
    json_build_object('sub', p_user, 'role', 'authenticated')::text
  );
end $$;

create or replace function pg_temp.become_anon() returns void language plpgsql as $$
begin
  execute 'set local role anon';
  execute 'set local request.jwt.claims = ''{"role":"anon"}''';
end $$;

-- auth.users first: profiles.id references it.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, created_at, updated_at)
select v, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
       k || '@rls.test',
       -- Never used: no assertion signs in. A literal keeps the suite from
       -- depending on which schema pgcrypto happens to be installed into.
       '$2a$10$rls.fixture.never.authenticates.aaaaaaaaaaaaaaaaaaaaaaaaaa',
       now(), now()
from t_ids
where k in ('client_a', 'client_b', 'staff_lo', 'staff_hi', 'admin');

insert into public.organizations (id, name, slug)
values (pg_temp.id('org_a'), 'RLS Fixture A', 'rls-fixture-a'),
       (pg_temp.id('org_b'), 'RLS Fixture B', 'rls-fixture-b');

-- The signup trigger may have created profile rows already; upsert over them
-- so this file does not depend on whether that trigger exists.
insert into public.profiles (id, email, full_name, portal, role_id, organization_id, is_active)
values
  (pg_temp.id('client_a'), 'client_a@rls.test', 'Client A', 'CLIENT', 'client',            pg_temp.id('org_a'), true),
  (pg_temp.id('client_b'), 'client_b@rls.test', 'Client B', 'CLIENT', 'client',            pg_temp.id('org_b'), true),
  (pg_temp.id('staff_lo'), 'staff_lo@rls.test', 'Staff Lo', 'STAFF',  'senior-specialist', null,                true),
  (pg_temp.id('staff_hi'), 'staff_hi@rls.test', 'Staff Hi', 'STAFF',  'project-lead',      null,                true),
  (pg_temp.id('admin'),    'admin@rls.test',    'Admin',    'ADMIN',  'global-admin',      null,                true)
on conflict (id) do update set
  portal = excluded.portal,
  role_id = excluded.role_id,
  organization_id = excluded.organization_id,
  is_active = excluded.is_active;

insert into public.projects (id, organization_id, slug, name, status)
values (pg_temp.id('proj_a'), pg_temp.id('org_a'), 'rls-fixture-a-project', 'Fixture A project', 'Active'),
       (pg_temp.id('proj_b'), pg_temp.id('org_b'), 'rls-fixture-b-project', 'Fixture B project', 'Active');

insert into public.invoices (id, organization_id, number, status, issue_date, due_date)
values (pg_temp.id('inv_a'),       pg_temp.id('org_a'), 'RLS-A-001', 'sent',  current_date, current_date + 14),
       (pg_temp.id('inv_a_draft'), pg_temp.id('org_a'), 'RLS-A-002', 'draft', current_date, current_date + 14),
       (pg_temp.id('inv_b'),       pg_temp.id('org_b'), 'RLS-B-001', 'sent',  current_date, current_date + 14);

-- ==================================================================
--  1. Tenant isolation — the property the whole product rests on
-- ==================================================================

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_a'));

  select count(*) into n from public.invoices where id = pg_temp.id('inv_b');
  assert n = 0, 'ISOLATION: a client can read another organisation''s invoice';

  select count(*) into n from public.projects where id = pg_temp.id('proj_b');
  assert n = 0, 'ISOLATION: a client can read another organisation''s project';

  select count(*) into n from public.invoices where id = pg_temp.id('inv_a');
  assert n = 1, 'ISOLATION: a client cannot read their OWN organisation''s invoice (policy too tight)';

  select count(*) into n from public.projects where id = pg_temp.id('proj_a');
  assert n = 1, 'ISOLATION: a client cannot read their OWN organisation''s project (policy too tight)';
end $$;
reset role;

-- A draft invoice is an internal document. Clients must not see one before
-- it is issued, even though it belongs to their organisation.
do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_a'));
  select count(*) into n from public.invoices where id = pg_temp.id('inv_a_draft');
  assert n = 0, 'ISOLATION: a client can read a DRAFT invoice belonging to their own organisation';
end $$;
reset role;

-- The mirror image: B must not see A either. Asserting only one direction
-- would pass against a policy that hard-codes one organisation.
do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_b'));
  select count(*) into n from public.invoices where id = pg_temp.id('inv_a');
  assert n = 0, 'ISOLATION: isolation holds one way only — B can read A';
  select count(*) into n from public.invoices where id = pg_temp.id('inv_b');
  assert n = 1, 'ISOLATION: client B cannot read their own invoice';
end $$;
reset role;

-- ==================================================================
--  2. Writes — reading is scoped; writing must be refused outright
-- ==================================================================

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_a'));

  -- No UPDATE policy applies to a client, so the row is simply not visible
  -- to the update. Zero rows affected is the pass, not an exception.
  update public.invoices set notes = 'tampered' where id = pg_temp.id('inv_a');
  get diagnostics n = row_count;
  assert n = 0, 'WRITE: a client can UPDATE an invoice';

  update public.projects set name = 'tampered' where id = pg_temp.id('proj_a');
  get diagnostics n = row_count;
  assert n = 0, 'WRITE: a client can UPDATE a project';

  delete from public.invoices where id = pg_temp.id('inv_a');
  get diagnostics n = row_count;
  assert n = 0, 'WRITE: a client can DELETE an invoice';
end $$;
reset role;

do $$
declare ok boolean := false;
begin
  perform pg_temp.become(pg_temp.id('client_a'));
  begin
    insert into public.invoices (organization_id, number, status, issue_date, due_date)
    values (pg_temp.id('org_a'), 'RLS-FORGED', 'sent', current_date, current_date);
  exception when insufficient_privilege then
    ok := true;
  end;
  assert ok, 'WRITE: a client can INSERT an invoice for their own organisation';
end $$;
reset role;

-- ==================================================================
--  3. Privilege escalation — the profiles_update policy permits a user
--     to update their own row, so the guard trigger is the only thing
--     stopping "update profiles set portal = 'ADMIN' where id = me".
-- ==================================================================

do $$
declare blocked boolean;
begin
  perform pg_temp.become(pg_temp.id('client_a'));

  blocked := false;
  begin
    update public.profiles set portal = 'ADMIN' where id = pg_temp.id('client_a');
  exception when insufficient_privilege then blocked := true;
  end;
  assert blocked, 'ESCALATION: a client promoted themselves to the ADMIN portal';

  blocked := false;
  begin
    update public.profiles set role_id = 'global-admin' where id = pg_temp.id('client_a');
  exception when insufficient_privilege then blocked := true;
  end;
  assert blocked, 'ESCALATION: a client granted themselves the Global Admin role';

  -- Horizontal, and the easiest to overlook: keep the CLIENT portal, just
  -- point at someone else's organisation and every isolation assertion
  -- above becomes vacuous.
  blocked := false;
  begin
    update public.profiles set organization_id = pg_temp.id('org_b') where id = pg_temp.id('client_a');
  exception when insufficient_privilege then blocked := true;
  end;
  assert blocked, 'ESCALATION: a client moved themselves into another organisation';

  -- Activation state is an admin decision. Note the value must DIFFER from
  -- the current one: the guard fires on `is distinct from`, so asserting
  -- `set is_active = true` on an already-active row passes vacuously — it
  -- is not a change, so nothing is guarded, and the assertion proves
  -- nothing. The first run of this suite made exactly that mistake.
  blocked := false;
  begin
    update public.profiles set is_active = false where id = pg_temp.id('client_a');
  exception when insufficient_privilege then blocked := true;
  end;
  assert blocked, 'ESCALATION: a user can change their own is_active flag';
end $$;
reset role;

-- The guard must not be so blunt that ordinary self-service breaks.
do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_a'));
  update public.profiles set full_name = 'Renamed By Owner' where id = pg_temp.id('client_a');
  get diagnostics n = row_count;
  assert n = 1, 'ESCALATION GUARD TOO BROAD: a user cannot edit their own display name';
end $$;
reset role;

-- Nor may one user edit another user's row at all.
do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('client_a'));
  update public.profiles set full_name = 'Renamed By Stranger' where id = pg_temp.id('client_b');
  get diagnostics n = row_count;
  assert n = 0, 'ISOLATION: a user can edit another user''s profile';

  select count(*) into n from public.profiles where id = pg_temp.id('client_b');
  assert n = 0, 'ISOLATION: a user can read another user''s profile';
end $$;
reset role;

-- ==================================================================
--  4. Staff scoping — migration 0061. `projects_select` used to read
--     `current_portal() = 'STAFF'`, i.e. every staff member could read
--     every project of every client. It is now assignment-scoped, and
--     level 3+ is the deliberate exception.
-- ==================================================================

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('staff_lo'));
  select count(*) into n from public.projects where id = pg_temp.id('proj_a');
  assert n = 0, 'STAFF SCOPING: an unassigned level-2 staff member can read a project';
end $$;
reset role;

insert into public.project_assignments (project_id, profile_id, role_on_project)
values (pg_temp.id('proj_a'), pg_temp.id('staff_lo'), 'Specialist');

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('staff_lo'));
  select count(*) into n from public.projects where id = pg_temp.id('proj_a');
  assert n = 1, 'STAFF SCOPING: an ASSIGNED staff member cannot read their own project';
  select count(*) into n from public.projects where id = pg_temp.id('proj_b');
  assert n = 0, 'STAFF SCOPING: assignment to one project leaked access to another';
end $$;
reset role;

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('staff_hi'));
  select count(*) into n from public.projects where id in (pg_temp.id('proj_a'), pg_temp.id('proj_b'));
  assert n = 2, 'STAFF SCOPING: a level-3 lead cannot see all projects (the documented exception)';
end $$;
reset role;

-- An assignment that has ended must stop granting access. This is the
-- clause most likely to be dropped in a future rewrite of the helper.
update public.project_assignments
   set starts_on = current_date - 30, ends_on = current_date - 1
 where project_id = pg_temp.id('proj_a') and profile_id = pg_temp.id('staff_lo');

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('staff_lo'));
  select count(*) into n from public.projects where id = pg_temp.id('proj_a');
  assert n = 0, 'STAFF SCOPING: an EXPIRED assignment still grants project access';
end $$;
reset role;

-- ==================================================================
--  5. Admin reach — the counterweight. If everything above passes and
--     this fails, the policies are merely broken rather than secure.
-- ==================================================================

do $$
declare n int;
begin
  perform pg_temp.become(pg_temp.id('admin'));
  select count(*) into n from public.invoices
   where id in (pg_temp.id('inv_a'), pg_temp.id('inv_a_draft'), pg_temp.id('inv_b'));
  assert n = 3, format('ADMIN: an administrator cannot read all invoices (saw %s of 3)', n);

  select count(*) into n from public.projects where id in (pg_temp.id('proj_a'), pg_temp.id('proj_b'));
  assert n = 2, 'ADMIN: an administrator cannot read all projects';

  update public.invoices set notes = 'admin edit' where id = pg_temp.id('inv_a');
  get diagnostics n = row_count;
  assert n = 1, 'ADMIN: an administrator cannot update an invoice';
end $$;
reset role;

-- ==================================================================
--  6. Anonymous — the anon key ships in the browser bundle. Everything
--     it can reach is public, whether or not a page links to it.
-- ==================================================================

do $$
declare n int;
begin
  perform pg_temp.become_anon();

  select count(*) into n from public.invoices;
  assert n = 0, format('ANON: the public key can read %s invoice(s)', n);

  select count(*) into n from public.projects;
  assert n = 0, format('ANON: the public key can read %s project(s)', n);

  select count(*) into n from public.organizations;
  assert n = 0, format('ANON: the public key can read %s organisation(s)', n);

  select count(*) into n from public.leads;
  assert n = 0, format('ANON: the public key can read %s lead(s) — enquiry contents are public', n);

  select count(*) into n from public.audit_log;
  assert n = 0, format('ANON: the public key can read %s audit_log row(s)', n);

  -- profiles is readable anonymously *only* through the published-staff
  -- policy. A fixture profile has no staff_profiles row, so none of them
  -- may appear.
  select count(*) into n from public.profiles
   where id in (pg_temp.id('client_a'), pg_temp.id('staff_lo'), pg_temp.id('admin'));
  assert n = 0, 'ANON: the public key can read non-published profiles';
end $$;
reset role;

-- Reached only if every assertion above held.
select '✓ ALL RLS ASSERTIONS PASSED' as result, 31 as assertions;

rollback;
