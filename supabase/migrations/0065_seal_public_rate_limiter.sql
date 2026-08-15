-- =============================================================================
-- 0065_seal_public_rate_limiter.sql
--
-- Supersedes the approach taken in 0064, which fixed the outage but at a price
-- worth undoing.
--
-- 0064 made `submit_lead` and `subscribe_newsletter` SECURITY DEFINER so they
-- could reach `private.consume_rate_limit`. That worked, and it raised four
-- database-linter warnings (0028/0029): two public entry points now run as
-- owner and are callable by `anon`. Each warning is individually explainable —
-- and a security surface where every alarm has an explanation attached is a
-- security surface nobody reads.
--
-- The two obvious alternatives are both worse:
--
--   * Grant EXECUTE on `private.consume_rate_limit` to anon. Its arguments
--     include the bucket, the limit AND the window, so anonymous callers could
--     invent bucket names at will and fill `rate_limits` with rows of their
--     choosing.
--   * Move the limit into `private.create_lead`. That helper is also used by
--     staff creating a lead by hand, who must not be rate-limited.
--
-- So: one narrow delegate. `private.consume_public_rate_limit` takes a bucket
-- and an identifier and nothing else — the limit and the window live inside it,
-- against a fixed list of buckets, and an unknown bucket is refused rather than
-- created. It is DEFINER (it must write `rate_limits`, which no public role may
-- touch) and granted to anon, exactly as `private.create_lead` has been since
-- 0041. The general limiter stays sealed for internal callers.
--
-- The entry points go back to SECURITY INVOKER, which clears all four warnings
-- and restores the property that matters: nothing in `public` runs as owner.
-- =============================================================================

create or replace function private.consume_public_rate_limit(
  p_bucket     text,
  p_identifier text
) returns boolean
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_limit  integer;
  v_window interval;
begin
  -- The policy lives here, not in the caller's argument list. A caller that
  -- cannot name its own limit cannot raise it.
  case p_bucket
    when 'submit_lead'          then v_limit := 5; v_window := interval '15 minutes';
    when 'subscribe_newsletter' then v_limit := 3; v_window := interval '15 minutes';
    else
      -- Not "allow by default". An unknown bucket is a programming error on
      -- our side or an invented one on theirs; both should be loud.
      raise exception 'unknown rate limit bucket %', p_bucket using errcode = '22023';
  end case;

  return private.consume_rate_limit(p_bucket, p_identifier, v_limit, v_window);
end; $$;

revoke all on function private.consume_public_rate_limit(text, text) from public;
grant execute on function private.consume_public_rate_limit(text, text) to anon, authenticated;

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

  if not private.consume_public_rate_limit('submit_lead', lower(p_email)) then
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
set search_path to ''
as $$
begin
  if position('@' in coalesce(p_email,'')) < 2 or length(btrim(p_email)) < 5 then
    raise exception 'valid email required' using errcode='check_violation';
  end if;

  if not private.consume_public_rate_limit('subscribe_newsletter', lower(p_email)) then
    raise exception 'Too many attempts. Please try again shortly.' using errcode='too_many_connections';
  end if;

  perform private.add_subscriber(p_email, p_source);
end; $$;

grant execute on function public.submit_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated;
grant execute on function public.subscribe_newsletter(text,text)
  to anon, authenticated;

-- Restated: the general limiter remains callable only by internal code.
revoke all on function private.consume_rate_limit(text,text,integer,interval)
  from public, anon, authenticated;

select private.record_migration('0065', 'seal_public_rate_limiter');
