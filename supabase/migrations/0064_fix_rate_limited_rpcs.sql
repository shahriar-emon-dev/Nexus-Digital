-- =============================================================================
-- 0064_fix_rate_limited_rpcs.sql
--
-- REGRESSION FIX. Migration 0062 added fixed-window rate limiting and wired it
-- into the two public RPCs:
--
--     if not private.consume_rate_limit('submit_lead', lower(p_email), 5, ...)
--
-- `private.consume_rate_limit` is SECURITY DEFINER, but per migration 0042
-- ("lock_down_private_execute") nothing in `private` carries a default EXECUTE
-- grant — each delegate is granted explicitly. 0062 never granted this one.
--
-- `submit_lead` and `subscribe_newsletter` are SECURITY INVOKER, so the call
-- ran as `anon`, and `anon` had no EXECUTE. Every submission since 0062 failed
-- with:
--
--     42501: permission denied for function consume_rate_limit
--
-- The public contact form and the newsletter signup have both been dead since
-- that migration applied. Nothing surfaced it: the browser showed the server
-- action's error, the leads table simply stayed empty, and an empty leads table
-- looks exactly like a quiet week. It was found by a database-level test that
-- called submit_lead as `anon` — the first thing to exercise the function the
-- way the website does.
--
-- THE FIX, AND WHY THIS ONE.
--
-- The obvious repair is `grant execute on private.consume_rate_limit to anon`.
-- That works and is wrong. The limiter's arguments include the bucket, the
-- identifier and the limit itself, so handing it to anonymous callers lets
-- anyone burn a chosen address's budget before its owner ever loads the page —
-- a targeted lockout — and fill `rate_limits` with rows of their choosing.
-- A rate limiter that the rate-limited party may call directly is decoration.
--
-- Instead the two entry points become SECURITY DEFINER. They already validate
-- every argument, they already delegate to `private.create_lead` /
-- `private.add_subscriber` (both DEFINER since 0040/0056), so this grants no
-- reach they did not already have — and the limiter stays unreachable from
-- PostgREST. `search_path` is pinned to '' in both, which is what makes running
-- as owner safe.
-- =============================================================================

-- ---------------------------------------------------------------- submit_lead
create or replace function public.submit_lead(
  p_full_name     text,
  p_email         text,
  p_brief         text,
  p_company       text default null,
  p_phone         text default null,
  p_project_title text default null,
  p_service_page  uuid default null,
  p_service_intent text default null,
  p_source        text default 'web-form'
) returns text
language plpgsql
security definer
set search_path to ''
as $$
begin
  if length(btrim(coalesce(p_full_name,''))) < 2 then
    raise exception 'name required' using errcode='check_violation';
  end if;
  if position('@' in coalesce(p_email,'')) < 2 then
    raise exception 'valid email required' using errcode='check_violation';
  end if;
  if length(btrim(coalesce(p_brief,''))) < 10 then
    raise exception 'brief required' using errcode='check_violation';
  end if;

  if not private.consume_rate_limit('submit_lead', lower(p_email), 5, interval '15 minutes') then
    raise exception 'Too many enquiries from this address. Please try again shortly.'
      using errcode='too_many_connections';
  end if;

  return private.create_lead(p_full_name, p_email, p_company, p_phone, p_project_title,
                             p_brief, p_service_page, p_service_intent, p_source);
end; $$;

-- ------------------------------------------------------- subscribe_newsletter
create or replace function public.subscribe_newsletter(
  p_email  text,
  p_source text default 'footer'
) returns void
language plpgsql
security definer
set search_path to ''
as $$
begin
  if position('@' in coalesce(p_email,'')) < 2 or length(btrim(p_email)) < 5 then
    raise exception 'valid email required' using errcode='check_violation';
  end if;

  if not private.consume_rate_limit('subscribe_newsletter', lower(p_email), 3, interval '15 minutes') then
    raise exception 'Too many attempts. Please try again shortly.' using errcode='too_many_connections';
  end if;

  perform private.add_subscriber(p_email, p_source);
end; $$;

-- A SECURITY DEFINER function is owned by the role that created it, so the
-- grants are restated rather than assumed. `public` keeps EXECUTE because the
-- contact form and footer are reachable to anonymous visitors by design.
grant execute on function public.submit_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated;
grant execute on function public.subscribe_newsletter(text,text)
  to anon, authenticated;

-- The limiter itself stays unreachable. Restated explicitly so a future
-- `grant ... on all functions in schema private` cannot quietly open it.
revoke all on function private.consume_rate_limit(text,text,integer,interval)
  from public, anon, authenticated;

select private.record_migration('0064', 'fix_rate_limited_rpcs');
