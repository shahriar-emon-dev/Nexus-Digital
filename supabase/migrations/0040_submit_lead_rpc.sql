-- =============================================================================
-- 0040_submit_lead_rpc.sql
--
-- Lets a visitor submit an enquiry and learn its reference, without granting
-- any ability to READ leads.
--
-- FOUND BY TESTING THE FORM RATHER THAN THE POLICY. 0039's insert policy let
-- anon write, and the server action used
--
--     insert into leads (...) select('reference').single()
--
-- INSERT ... RETURNING needs a SELECT policy on the row as well, and anon has
-- none by design — so every submission failed at the return step. A friendly
-- catch-all error message ("We could not record that just now") hid the cause
-- completely, which is its own lesson: the message was right for a visitor and
-- wrong for whoever had to debug it.
--
-- Same shape as slow_queries in 0030: a SECURITY INVOKER wrapper in `public`
-- that anon may call, delegating to a SECURITY DEFINER function in `private`,
-- which PostgREST never publishes. The definer bypasses RLS, so it pins the
-- fields the insert policy was there to protect rather than trusting its
-- caller.
--
-- SAFE TO RE-RUN. Requires 0039_leads.sql.
-- =============================================================================

create or replace function private.create_lead(
  p_full_name      text,
  p_email          text,
  p_company        text,
  p_phone          text,
  p_project_title  text,
  p_brief          text,
  p_service_page   uuid,
  p_service_intent text,
  p_source         text
) returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reference text;
begin
  insert into public.leads (
    full_name, email, company, phone, project_title, brief,
    service_page_id, service_intent, source,
    -- Pinned here, not taken from the caller. This function runs as its owner
    -- and therefore bypasses the insert policy that used to enforce them.
    status, assignee_id, organization_id, closed_at, contacted_at
  ) values (
    btrim(p_full_name), lower(btrim(p_email)), nullif(btrim(coalesce(p_company,'')),''),
    nullif(btrim(coalesce(p_phone,'')),''), nullif(btrim(coalesce(p_project_title,'')),''),
    coalesce(p_brief,''), p_service_page, nullif(btrim(coalesce(p_service_intent,'')),''),
    coalesce(nullif(btrim(coalesce(p_source,'')),''), 'web-form'),
    'new', null, null, null, null
  )
  returning reference into v_reference;

  return v_reference;
end $$;

create or replace function public.submit_lead(
  p_full_name      text,
  p_email          text,
  p_brief          text,
  p_company        text default null,
  p_phone          text default null,
  p_project_title  text default null,
  p_service_page   uuid default null,
  p_service_intent text default null,
  p_source         text default 'web-form'
) returns text
language plpgsql
security invoker
set search_path = ''
as $$
begin
  -- Validated again here: the browser is not a trustworthy validator, and this
  -- function is reachable directly over the API.
  if length(btrim(coalesce(p_full_name,''))) < 2 then
    raise exception 'name required' using errcode = 'check_violation';
  end if;
  if position('@' in coalesce(p_email,'')) < 2 then
    raise exception 'valid email required' using errcode = 'check_violation';
  end if;
  if length(btrim(coalesce(p_brief,''))) < 10 then
    raise exception 'brief required' using errcode = 'check_violation';
  end if;

  return private.create_lead(
    p_full_name, p_email, p_company, p_phone, p_project_title,
    p_brief, p_service_page, p_service_intent, p_source);
end $$;

comment on function public.submit_lead is
  'Records an enquiry and returns only its reference. Anon may call this but '
  'still cannot read the leads table.';

revoke all on function private.create_lead(text,text,text,text,text,text,uuid,text,text)
  from public, anon, authenticated;
grant execute on function public.submit_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated;

select private.record_migration('0040', 'submit_lead_rpc');
