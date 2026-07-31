-- =============================================================================
-- auth_security_check.sql
--
-- Verifies the Feature 1 (Authentication) security properties against the live
-- database. Paste into the Supabase SQL Editor and Run. It prints a pass/fail
-- table — no output means something aborted.
--
-- SAFE TO RUN ON PRODUCTION:
--   * It creates one throwaway auth user and deletes it before finishing.
--   * The whole script is one transaction, so if any step raises, every change
--     including the probe user is rolled back.
--   * It never reads, modifies or deletes real user rows.
--
-- Re-run this after any migration that touches profiles, roles or RLS.
-- =============================================================================

do $$
declare
  probe  uuid := '9e000000-0000-4000-a000-00000000e2e1';
  admin  uuid;
  n      int;
  msg    text;
  before_portal text;
begin
  create temp table _check (seq int, area text, test text, result text) on commit drop;
  grant insert, select on _check to authenticated;

  -- An existing ADMIN is needed for the positive-path tests.
  select id into admin from public.profiles where portal = 'ADMIN' and is_active limit 1;
  if admin is null then
    insert into _check values (0,'setup','an active ADMIN profile exists',
      'CANNOT TEST - no admin found');
    create temp table _out on commit drop as select * from _check;
    return;
  end if;

  -- ---------------------------------------------------------------- schema --
  select count(*) into n from pg_proc p join pg_namespace ns on ns.oid = p.pronamespace
   where ns.nspname = 'public' and p.prosecdef and p.proname <> 'rls_auto_enable';
  insert into _check values (1,'schema','no SECURITY DEFINER funcs exposed in public',
    case when n = 0 then 'PASS' else 'FAIL - ' || n || ' exposed via /rest/v1/rpc' end);

  select count(*) into n from pg_tables t
   where t.schemaname = 'public'
     and not exists (select 1 from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
                      where ns.nspname = 'public' and c.relname = t.tablename and c.relrowsecurity);
  insert into _check values (2,'schema','every public table has RLS enabled',
    case when n = 0 then 'PASS' else 'FAIL - ' || n || ' table(s) without RLS' end);

  select count(*) into n from pg_publication_tables
   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles';
  insert into _check values (3,'schema','profiles published to realtime',
    case when n = 1 then 'PASS' else 'FAIL' end);

  -- ------------------------------------------------------- signup defaults --
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data, is_super_admin,
    -- GoTrue cannot scan NULL into a string; real signups write ''. Omitting
    -- these makes the row unusable for sign-in.
    confirmation_token, recovery_token, email_change_token_new, email_change
  ) values (
    '00000000-0000-0000-0000-000000000000', probe, 'authenticated', 'authenticated',
    'security-check@example.invalid', crypt('probe-only', gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    -- Deliberately claims ADMIN. The trigger must ignore it.
    '{"full_name":"Security Check","portal":"ADMIN","role_id":"global-admin"}'::jsonb,
    false, '', '', '', ''
  );

  select count(*) into n from public.profiles
   where id = probe and portal = 'CLIENT' and role_id is null;
  insert into _check values (4,'signup','trigger provisions a profile automatically',
    case when n = 1 then 'PASS' else 'FAIL - not created or wrong defaults' end);

  select count(*) into n from public.profiles where id = probe and portal = 'ADMIN';
  insert into _check values (5,'signup','signup metadata CANNOT grant ADMIN',
    case when n = 0 then 'PASS - ignored' else 'FAIL - metadata escalated to ADMIN' end);

  -- --------------------------------------------------- end-user restrictions --
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', probe, 'role', 'authenticated')::text, true);

  select portal::text into before_portal from public.profiles where id = probe;

  begin
    update public.profiles set portal = 'ADMIN' where id = probe;
    get diagnostics n = ROW_COUNT;
    insert into _check values (6,'escalation','user cannot promote itself to ADMIN',
      'FAIL - allowed, ' || n || ' row(s)');
  exception when others then
    insert into _check values (6,'escalation','user cannot promote itself to ADMIN','PASS - blocked');
  end;

  begin
    update public.profiles set role_id = 'global-admin' where id = probe;
    insert into _check values (7,'escalation','user cannot grant itself a role','FAIL - allowed');
  exception when others then
    insert into _check values (7,'escalation','user cannot grant itself a role','PASS - blocked');
  end;

  begin
    update public.profiles set is_active = false where id = probe;
    insert into _check values (8,'escalation','user cannot flip its own is_active','FAIL - allowed');
  exception when others then
    insert into _check values (8,'escalation','user cannot flip its own is_active','PASS - blocked');
  end;

  begin
    update public.profiles set full_name = 'Renamed' where id = probe;
    get diagnostics n = ROW_COUNT;
    insert into _check values (9,'escalation','user CAN still edit its own name',
      case when n = 1 then 'PASS - allowed' else 'FAIL - own edit blocked' end);
  exception when others then
    insert into _check values (9,'escalation','user CAN still edit its own name','FAIL - blocked');
  end;

  select count(*) into n from public.profiles;
  insert into _check values (10,'rls','user sees only its own profile row',
    case when n = 1 then 'PASS - 1 row' else 'FAIL - sees ' || n end);

  select count(*) into n from public.profiles where id = admin;
  insert into _check values (11,'rls','user cannot read the admin profile',
    case when n = 0 then 'PASS - denied' else 'FAIL - leaked' end);

  begin
    update public.roles set name = 'hijacked' where id = 'global-admin';
    get diagnostics n = ROW_COUNT;
    insert into _check values (12,'rls','user cannot write the roles table',
      case when n = 0 then 'PASS - denied' else 'FAIL - wrote ' || n end);
  exception when others then
    insert into _check values (12,'rls','user cannot write the roles table','PASS - denied');
  end;

  select count(*) into n from public.schema_migrations;
  insert into _check values (13,'rls','user cannot read the migration registry',
    case when n = 0 then 'PASS - denied' else 'FAIL - sees ' || n end);

  reset role;

  -- Confirm nothing above actually changed the row on disk.
  select count(*) into n from public.profiles
   where id = probe and portal::text = before_portal and role_id is null and is_active;
  insert into _check values (14,'escalation','probe row provably unmodified on disk',
    case when n = 1 then 'PASS' else 'FAIL - row was altered' end);

  -- ---------------------------------------------------------- admin powers --
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin, 'role', 'authenticated')::text, true);

  select count(*) into n from public.profiles;
  insert into _check values (15,'admin','admin sees all profiles',
    case when n >= 2 then 'PASS - ' || n || ' rows' else 'FAIL - sees ' || n end);

  begin
    update public.profiles set portal = 'STAFF', role_id = 'project-lead' where id = probe;
    get diagnostics n = ROW_COUNT;
    insert into _check values (16,'admin','admin CAN assign portal and role',
      case when n = 1 then 'PASS' else 'FAIL - wrote ' || n end);
  exception when others then
    get stacked diagnostics msg = MESSAGE_TEXT;
    insert into _check values (16,'admin','admin CAN assign portal and role','FAIL - ' || left(msg,40));
  end;

  select count(*) into n from public.schema_migrations;
  insert into _check values (17,'admin','admin CAN read the migration registry',
    case when n >= 1 then 'PASS - ' || n || ' migrations' else 'FAIL - sees 0' end);

  reset role;

  -- --------------------------------------------------------------- cleanup --
  create temp table _out on commit drop as select * from _check;
  delete from auth.users where id = probe;

  select count(*) into n from public.profiles where id = probe;
  insert into _out values (18,'cleanup','cascade delete removed the probe profile',
    case when n = 0 then 'PASS' else 'FAIL - orphan profile left behind' end);
end $$;

select seq as "#", area, test, result from _out order by seq;
