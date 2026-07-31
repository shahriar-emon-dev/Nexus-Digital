-- =============================================================================
-- profiles_security_check.sql
--
-- Verifies the Feature 2 (User Profiles) properties: organisation linking on
-- signup, tenant isolation, and the privilege guard's coverage of
-- organization_id.
--
-- Checks 10 and 11 exist because 0004 shipped a cross-tenant hole: the guard
-- protected portal, role_id and is_active but not organization_id, so a user
-- could move itself into another company and then read that company through
-- `organizations_select`. 0005 closed it.
--
-- SAFE TO RUN ON PRODUCTION:
--   * Creates three throwaway auth users and two organisations, then removes
--     them. One transaction, so any failure rolls all of it back.
--   * Never reads, modifies or deletes real rows.
-- =============================================================================

do $$
declare
  u1 uuid := '9e000000-0000-4000-a000-0000000000a1';
  u2 uuid := '9e000000-0000-4000-a000-0000000000a2';
  u3 uuid := '9e000000-0000-4000-a000-0000000000a3';
  admin uuid; n int; msg text; org1 uuid; org3 uuid;
begin
  create temp table _c (seq int, test text, result text) on commit drop;
  grant insert, select on _c to authenticated;

  select id into admin from public.profiles where portal = 'ADMIN' and is_active limit 1;
  if admin is null then
    insert into _c values (0, 'an active ADMIN profile exists', 'CANNOT TEST - none found');
    create temp table _o on commit drop as select * from _c;
    return;
  end if;

  insert into auth.users (instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, confirmation_token, recovery_token, email_change_token_new, email_change)
  values
   ('00000000-0000-0000-0000-000000000000', u1, 'authenticated', 'authenticated',
    'p1@example.invalid', crypt('x', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"P One","company":"Northwind Retail","industry":"E-commerce","phone":"+44 20 7946 0000"}'::jsonb,
    false, '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', u2, 'authenticated', 'authenticated',
    'p2@example.invalid', crypt('x', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"P Two","company":"  northwind retail  "}'::jsonb,
    false, '', '', '', ''),
   ('00000000-0000-0000-0000-000000000000', u3, 'authenticated', 'authenticated',
    'p3@example.invalid', crypt('x', gen_salt('bf')), now(), now(), now(),
    '{"provider":"email"}'::jsonb,
    '{"full_name":"P Three","company":"Acme Logistics","industry":"Freight"}'::jsonb,
    false, '', '', '', '');

  select organization_id into org1 from public.profiles where id = u1;
  select organization_id into org3 from public.profiles where id = u3;

  select count(*) into n from public.profiles
   where id = u1 and phone = '+44 20 7946 0000' and organization_id is not null;
  insert into _c values (1, 'registration persists phone and links an org',
    case when n = 1 then 'PASS' else 'FAIL' end);

  select count(*) into n from public.profiles where id = u2 and organization_id = org1;
  insert into _c values (2, 'messy casing reuses the same org',
    case when n = 1 then 'PASS' else 'FAIL - duplicate org created' end);

  select count(*) into n from public.organizations where slug in ('northwind-retail','acme-logistics');
  insert into _c values (3, 'exactly 2 organizations created',
    case when n = 2 then 'PASS - 2' else 'FAIL - ' || n end);

  select count(*) into n from public.organizations
   where slug = 'northwind-retail' and industry = 'E-commerce';
  insert into _c values (4, 'slug and industry derived correctly',
    case when n = 1 then 'PASS' else 'FAIL' end);

  -- ------------------------------------------------------ tenant isolation --
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', u1, 'role', 'authenticated')::text, true);

  select count(*) into n from public.organizations;
  insert into _c values (5, 'user sees only its own organization',
    case when n = 1 then 'PASS - 1' else 'FAIL - sees ' || n end);

  begin
    update public.organizations set name = 'Hijacked' where id = org3;
    get diagnostics n = ROW_COUNT;
    insert into _c values (6, 'user cannot write another org',
      case when n = 0 then 'PASS - 0 rows' else 'FAIL - wrote ' || n end);
  exception when others then
    insert into _c values (6, 'user cannot write another org', 'PASS - blocked');
  end;

  begin
    update public.organizations set tier = 'Premium' where id = org1;
    get diagnostics n = ROW_COUNT;
    insert into _c values (7, 'user cannot write its OWN org (admin-only)',
      case when n = 0 then 'PASS - 0 rows' else 'FAIL - wrote ' || n end);
  exception when others then
    insert into _c values (7, 'user cannot write its OWN org (admin-only)', 'PASS - blocked');
  end;

  -- --------------------------------------------------------- self-service --
  begin
    update public.profiles
       set job_title = 'Head of Ops', bio = 'Short bio.', timezone = 'Europe/London'
     where id = u1;
    get diagnostics n = ROW_COUNT;
    insert into _c values (8, 'user CAN edit own job_title, bio and timezone',
      case when n = 1 then 'PASS' else 'FAIL - wrote ' || n end);
  exception when others then
    get stacked diagnostics msg = MESSAGE_TEXT;
    insert into _c values (8, 'user CAN edit own job_title, bio and timezone', 'FAIL - ' || left(msg,40));
  end;

  begin
    update public.profiles set bio = repeat('x', 601) where id = u1;
    insert into _c values (9, 'bio length ceiling enforced', 'FAIL - oversized bio accepted');
  exception when others then
    insert into _c values (9, 'bio length ceiling enforced', 'PASS - rejected');
  end;

  -- ------------------------------------------------- the 0005 regression ---
  begin
    update public.profiles set organization_id = org3 where id = u1;
    get diagnostics n = ROW_COUNT;
    insert into _c values (10, 'user cannot move itself to another org',
      'FAIL - reassigned, ' || n || ' row(s)');
  exception when others then
    insert into _c values (10, 'user cannot move itself to another org', 'PASS - blocked');
  end;

  begin
    update public.profiles set organization_id = null where id = u1;
    insert into _c values (11, 'user cannot orphan itself from its org', 'FAIL - allowed');
  exception when others then
    insert into _c values (11, 'user cannot orphan itself from its org', 'PASS - blocked');
  end;
  reset role;

  select count(*) into n from public.profiles where id = u1 and organization_id = org1;
  insert into _c values (12, 'org membership provably unchanged on disk',
    case when n = 1 then 'PASS' else 'FAIL - was reassigned' end);

  -- ------------------------------------------------------------ admin path --
  set local role authenticated;
  perform set_config('request.jwt.claims',
    json_build_object('sub', admin, 'role', 'authenticated')::text, true);

  begin
    update public.profiles set organization_id = org3 where id = u1;
    get diagnostics n = ROW_COUNT;
    insert into _c values (13, 'admin CAN reassign org membership',
      case when n = 1 then 'PASS' else 'FAIL - wrote ' || n end);
  exception when others then
    get stacked diagnostics msg = MESSAGE_TEXT;
    insert into _c values (13, 'admin CAN reassign org membership', 'FAIL - ' || left(msg,40));
  end;

  select count(*) into n from public.organizations where slug in ('northwind-retail','acme-logistics');
  insert into _c values (14, 'admin sees all organizations',
    case when n = 2 then 'PASS - 2' else 'FAIL - ' || n end);
  reset role;

  create temp table _o on commit drop as select * from _c;
  delete from auth.users where id in (u1, u2, u3);
  delete from public.organizations where slug in ('northwind-retail','acme-logistics');
end $$;

select seq as "#", test, result from _o order by seq;
