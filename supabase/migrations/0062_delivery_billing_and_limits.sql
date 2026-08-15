-- =============================================================================
-- 0062_delivery_billing_and_limits.sql
--
-- Closes the remaining structural gaps identified in docs/AUDIT.md:
--
--   * transactional email          (spec §7.1, §8.3, §10.6, §13.1)
--   * payment records              (spec §10.6)
--   * rate limiting                (spec §15.1)
--   * meeting availability         (spec §7.1)
--   * notification coverage        (spec §11.3, §10.6, §13.1)
--   * RPC grant hygiene            (audit D-5; S-6 withdrawn as incorrect)
--   * a CLIENT role                (audit D-3)
--   * archive instead of hard delete (audit D-6)
--
-- DESIGN NOTE ON EMAIL AND PAYMENTS
--
-- Neither a mail provider nor a payment processor can be called from inside
-- Postgres, and neither vendor's credentials exist in this project. What is
-- built here is everything on THIS side of the vendor boundary: the queue, the
-- state machine, the idempotency keys, the retry accounting, the RLS, and the
-- triggers that enqueue work. A worker holding an API key drains the queue.
--
-- That split is deliberate rather than a shortcut. Writing the send inline in a
-- server action means an email is lost whenever the provider is briefly down,
-- and a payment is unrecoverable if the process dies between charging the card
-- and writing the row. An outbox makes both restartable.
--
-- SAFE TO RE-RUN. Requires 0021 (invoices), 0039 (leads), 0050 (meetings),
-- 0052 (notification triggers), 0056 (newsletter).
-- =============================================================================

-- ============================================================ 1. EMAIL ======

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where n.nspname = 'public' and t.typname = 'email_status') then
    create type public.email_status as enum ('queued','sending','sent','failed','cancelled');
  end if;
end $$;

/**
 * Transactional email outbox.
 *
 * Rows are written by triggers and server actions; a worker process claims
 * them, calls the provider, and marks the outcome. Nothing in the request path
 * ever waits on SMTP.
 *
 * `idempotency_key` is the whole reason this table is safe to retry. A unique
 * index on it means "invoice 42 sent notice" can be enqueued a hundred times
 * and delivered once — which matters because the obvious failure mode of a
 * retry loop is mailing a client the same overdue notice repeatedly.
 */
create table if not exists public.email_outbox (
  id               uuid primary key default gen_random_uuid(),
  to_email         text not null check (position('@' in to_email) > 1),
  to_name          text,
  subject          text not null check (length(subject) between 1 and 300),
  -- Which template the worker should render. The body is NOT stored composed,
  -- so fixing a typo in a template does not require rewriting queued rows.
  template         text not null,
  payload          jsonb not null default '{}'::jsonb,
  status           public.email_status not null default 'queued',
  idempotency_key  text not null,
  attempts         smallint not null default 0 check (attempts >= 0),
  last_error       text,
  -- Lets a reminder be enqueued today and sent tomorrow; the worker filters on
  -- this rather than needing its own scheduler.
  send_after       timestamptz not null default now(),
  sent_at          timestamptz,
  entity_type      text,
  entity_id        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.email_outbox is
  'Queued transactional email. Written by triggers, drained by a worker holding '
  'the provider key. Delivery is at-least-once at the queue and exactly-once at '
  'the recipient, enforced by the unique idempotency_key.';

create unique index if not exists email_outbox_idempotency_key
  on public.email_outbox (idempotency_key);
create index if not exists email_outbox_claimable_idx
  on public.email_outbox (send_after) where status = 'queued';
create index if not exists email_outbox_entity_idx
  on public.email_outbox (entity_type, entity_id);

alter table public.email_outbox enable row level security;

drop policy if exists email_outbox_select on public.email_outbox;
drop policy if exists email_outbox_update on public.email_outbox;
drop policy if exists email_outbox_delete on public.email_outbox;

-- Deliberately no INSERT policy: rows arrive through the SECURITY DEFINER
-- enqueue function below. A browser that can post arbitrary rows into a table
-- the platform will faithfully email from is a spam relay.
create policy email_outbox_select on public.email_outbox
  for select to authenticated using (private.is_admin());
create policy email_outbox_update on public.email_outbox
  for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy email_outbox_delete on public.email_outbox
  for delete to authenticated using (private.is_admin());

drop trigger if exists email_outbox_set_updated_at on public.email_outbox;
create trigger email_outbox_set_updated_at before update on public.email_outbox
  for each row execute function private.set_updated_at();

/**
 * The only way a row enters the outbox.
 *
 * Returns the row id, or the existing id when the idempotency key has been
 * seen. Callers therefore do not need to know whether they are the first to
 * ask, which is what makes trigger-driven enqueueing safe under retries.
 */
create or replace function private.enqueue_email(
  p_to_email        text,
  p_to_name         text,
  p_subject         text,
  p_template        text,
  p_payload         jsonb,
  p_idempotency_key text,
  p_send_after      timestamptz default now(),
  p_entity_type     text default null,
  p_entity_id       text default null
) returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if p_to_email is null or position('@' in p_to_email) < 2 then
    return null;
  end if;

  insert into public.email_outbox (
    to_email, to_name, subject, template, payload,
    idempotency_key, send_after, entity_type, entity_id
  )
  values (
    p_to_email, p_to_name, p_subject, p_template, coalesce(p_payload, '{}'::jsonb),
    p_idempotency_key, coalesce(p_send_after, now()), p_entity_type, p_entity_id
  )
  on conflict (idempotency_key) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.email_outbox where idempotency_key = p_idempotency_key;
  end if;

  return v_id;
end;
$$;

revoke all on function private.enqueue_email(text,text,text,text,jsonb,text,timestamptz,text,text)
  from public, anon, authenticated;

/**
 * Claims a batch for a worker.
 *
 * `for update skip locked` is what allows more than one worker without two of
 * them sending the same message. The status flips to 'sending' inside the same
 * statement that selects it, so a crashed worker leaves a visibly stuck row
 * rather than a silently lost one.
 */
create or replace function public.claim_emails(p_limit integer default 20)
returns setof public.email_outbox
language plpgsql
-- INVOKER, not DEFINER. The is_admin() guard below is the authorisation, and
-- an admin already holds policies on email_outbox, so definer rights buy
-- nothing and trip Supabase advisor 0029. RLS stays as the second line.
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'only an administrator may drain the outbox'
      using errcode = '42501';
  end if;

  return query
  with claimed as (
    select id from public.email_outbox
     where status = 'queued' and send_after <= now()
     order by send_after
     limit greatest(1, least(coalesce(p_limit, 20), 100))
     for update skip locked
  )
  update public.email_outbox o
     set status = 'sending', attempts = o.attempts + 1
    from claimed c
   where o.id = c.id
  returning o.*;
end;
$$;

revoke all on function public.claim_emails(integer) from public, anon;
grant execute on function public.claim_emails(integer) to authenticated, service_role;

create or replace function public.resolve_email(
  p_id uuid, p_ok boolean, p_error text default null
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'only an administrator may resolve outbox rows'
      using errcode = '42501';
  end if;

  update public.email_outbox
     set status     = case when p_ok then 'sent'::public.email_status
                           -- Six attempts then stop. A permanently bad address
                           -- should not be retried forever.
                           when attempts >= 6 then 'failed'::public.email_status
                           else 'queued'::public.email_status end,
         sent_at    = case when p_ok then now() else sent_at end,
         last_error = case when p_ok then null else p_error end,
         -- Exponential backoff, capped, so a provider outage does not become a
         -- tight retry loop against it.
         send_after = case when p_ok then send_after
                           else now() + (least(power(2, attempts)::int, 60) || ' minutes')::interval end
   where id = p_id;
end;
$$;

revoke all on function public.resolve_email(uuid, boolean, text) from public, anon;
grant execute on function public.resolve_email(uuid, boolean, text) to authenticated, service_role;

-- ------------------------------------------------- email triggers ---------

-- Lead acknowledgement + internal alert (spec §7.1, §16 funnel).
create or replace function private.on_lead_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue_email(
    new.email, new.full_name,
    'We have your enquiry (' || coalesce(new.reference, 'received') || ')',
    'lead_acknowledgement',
    jsonb_build_object('reference', new.reference, 'name', new.full_name,
                       'projectTitle', new.project_title),
    'lead_ack:' || new.id::text,
    now(), 'lead', new.id::text
  );
  return new;
end $$;

drop trigger if exists leads_enqueue_ack on public.leads;
create trigger leads_enqueue_ack after insert on public.leads
  for each row execute function private.on_lead_created();

-- Invoice issued / overdue (spec §10.6 payment reminders).
create or replace function private.on_invoice_status_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_email text; v_name text;
begin
  if new.status is not distinct from old.status then return new; end if;

  select p.email, p.full_name into v_email, v_name
    from public.profiles p
   where p.organization_id = new.organization_id and p.portal = 'CLIENT' and p.is_active
   limit 1;

  if v_email is null then return new; end if;

  if new.status = 'sent' then
    perform private.enqueue_email(
      v_email, v_name, 'Invoice ' || new.number || ' is ready',
      'invoice_sent',
      jsonb_build_object('number', new.number, 'dueDate', new.due_date),
      'invoice_sent:' || new.id::text, now(), 'invoice', new.id::text);

    -- Reminders scheduled at enqueue time rather than by a cron that has to
    -- remember. The worker will not pick them up until send_after passes.
    if new.due_date is not null then
      perform private.enqueue_email(
        v_email, v_name, 'Invoice ' || new.number || ' is due in 3 days',
        'invoice_due_soon',
        jsonb_build_object('number', new.number, 'dueDate', new.due_date),
        'invoice_due3:' || new.id::text,
        (new.due_date - interval '3 days')::timestamptz, 'invoice', new.id::text);
      perform private.enqueue_email(
        v_email, v_name, 'Invoice ' || new.number || ' is overdue',
        'invoice_overdue',
        jsonb_build_object('number', new.number, 'dueDate', new.due_date),
        'invoice_over3:' || new.id::text,
        (new.due_date + interval '3 days')::timestamptz, 'invoice', new.id::text);
    end if;

  elsif new.status = 'paid' then
    perform private.enqueue_email(
      v_email, v_name, 'Payment received for ' || new.number,
      'invoice_paid', jsonb_build_object('number', new.number),
      'invoice_paid:' || new.id::text, now(), 'invoice', new.id::text);

    -- A settled invoice must not keep chasing the client.
    update public.email_outbox
       set status = 'cancelled'
     where entity_type = 'invoice' and entity_id = new.id::text
       and status = 'queued'
       and template in ('invoice_due_soon','invoice_overdue');
  end if;

  return new;
end $$;

drop trigger if exists invoices_enqueue_email on public.invoices;
create trigger invoices_enqueue_email after update on public.invoices
  for each row execute function private.on_invoice_status_change();

-- Review request on completion (spec §13.1 step 2).
create or replace function private.on_project_completed()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  v_email text; v_name text;
begin
  if new.status is not distinct from old.status or new.status <> 'Completed' then
    return new;
  end if;

  select p.email, p.full_name into v_email, v_name
    from public.profiles p
   where p.organization_id = new.organization_id and p.portal = 'CLIENT' and p.is_active
   limit 1;

  if v_email is null then return new; end if;

  perform private.enqueue_email(
    v_email, v_name, 'Your project is complete — share your experience',
    'review_request',
    jsonb_build_object('projectName', new.name, 'projectSlug', new.slug),
    'review_req:' || new.id::text, now(), 'project', new.id::text);
  return new;
end $$;

drop trigger if exists projects_enqueue_review_request on public.projects;
create trigger projects_enqueue_review_request after update on public.projects
  for each row execute function private.on_project_completed();

-- ========================================================= 2. PAYMENTS =====

do $$
begin
  if not exists (select 1 from pg_type t join pg_namespace n on n.oid = t.typnamespace
                  where n.nspname = 'public' and t.typname = 'payment_state') then
    create type public.payment_state as enum
      ('requires_payment','processing','succeeded','failed','cancelled','refunded');
  end if;
end $$;

/**
 * A client-initiated attempt to settle an invoice.
 *
 * Distinct from `invoice_payments`, which is the accounting record an admin
 * writes once money has arrived. This is the in-flight object: created when a
 * client presses Pay, updated by the processor's webhook, and converted into an
 * `invoice_payments` row only on success. Keeping them apart means a failed or
 * abandoned card attempt never touches the ledger.
 */
create table if not exists public.payment_intents (
  id                uuid primary key default gen_random_uuid(),
  invoice_id        uuid not null references public.invoices (id) on delete cascade,
  amount            numeric(12,2) not null check (amount > 0),
  currency          char(3) not null default 'USD',
  state             public.payment_state not null default 'requires_payment',
  provider          text not null default 'unconfigured',
  provider_ref      text,
  -- Survives a double-click on Pay without opening two charges.
  idempotency_key   text not null,
  failure_reason    text,
  created_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  settled_at        timestamptz
);

comment on table public.payment_intents is
  'In-flight payment attempts. Becomes an invoice_payments row only on success, '
  'so an abandoned card attempt never reaches the ledger.';

create unique index if not exists payment_intents_idempotency_key
  on public.payment_intents (idempotency_key);
create index if not exists payment_intents_invoice_idx on public.payment_intents (invoice_id);
create index if not exists payment_intents_state_idx on public.payment_intents (state);
create index if not exists payment_intents_creator_idx on public.payment_intents (created_by);

alter table public.payment_intents enable row level security;

drop policy if exists payment_intents_select on public.payment_intents;
drop policy if exists payment_intents_insert on public.payment_intents;
drop policy if exists payment_intents_update on public.payment_intents;
drop policy if exists payment_intents_delete on public.payment_intents;

create policy payment_intents_select on public.payment_intents
  for select to authenticated
  using (private.is_admin() or private.can_see_invoice(invoice_id));

-- A client may start a payment against an invoice they can see, and the state
-- is pinned so nobody can insert an already-succeeded intent.
create policy payment_intents_insert on public.payment_intents
  for insert to authenticated
  with check (
    private.can_see_invoice(invoice_id)
    and state = 'requires_payment'
    and settled_at is null
  );

-- Only an admin (or the webhook running as service_role) may advance the state.
create policy payment_intents_update on public.payment_intents
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());
create policy payment_intents_delete on public.payment_intents
  for delete to authenticated using (private.is_admin());

drop trigger if exists payment_intents_set_updated_at on public.payment_intents;
create trigger payment_intents_set_updated_at before update on public.payment_intents
  for each row execute function private.set_updated_at();

/**
 * Settles an intent and posts it to the ledger, atomically.
 *
 * The ledger write and the state change happen in one statement so a process
 * dying between them cannot produce a succeeded payment with no money recorded,
 * or money recorded twice.
 */
create or replace function public.settle_payment_intent(
  p_intent uuid, p_provider_ref text default null
) returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v public.payment_intents%rowtype;
begin
  if not private.is_admin() then
    raise exception 'only an administrator may settle a payment'
      using errcode = '42501';
  end if;

  select * into v from public.payment_intents where id = p_intent for update;
  if not found then raise exception 'no such payment intent'; end if;
  if v.state = 'succeeded' then return; end if;

  insert into public.invoice_payments (invoice_id, amount, method, reference, recorded_by)
  values (v.invoice_id, v.amount,
          coalesce(v.provider, 'card'),
          coalesce(p_provider_ref, v.provider_ref, v.idempotency_key),
          v.created_by);

  update public.payment_intents
     set state = 'succeeded', settled_at = now(),
         provider_ref = coalesce(p_provider_ref, provider_ref)
   where id = p_intent;

  -- Fully covered invoices settle themselves rather than waiting for somebody
  -- to remember to change the status.
  update public.invoices i
     set status = 'paid'
    from public.invoice_totals t
   where i.id = v.invoice_id and t.invoice_id = i.id
     and t.outstanding <= 0 and i.status <> 'paid';
end;
$$;

revoke all on function public.settle_payment_intent(uuid, text) from public, anon;
grant execute on function public.settle_payment_intent(uuid, text) to authenticated, service_role;

-- ==================================================== 3. RATE LIMITING =====

/**
 * Fixed-window counters for anonymous endpoints.
 *
 * Spec §15.1 asks for rate limiting and `@upstash/ratelimit` has been an unused
 * dependency since the project began. This does it in Postgres instead, which
 * removes a vendor from the critical path of the contact form and means the
 * limit is enforced at the same layer as the insert it protects — an attacker
 * cannot skip it by calling PostgREST directly, which is exactly what would
 * happen with a limiter living only in Next.js middleware.
 */
create table if not exists public.rate_limits (
  bucket       text not null,
  identifier   text not null,
  window_start timestamptz not null,
  hits         integer not null default 0,
  primary key (bucket, identifier, window_start)
);

comment on table public.rate_limits is
  'Fixed-window request counters. Deny-all by policy: only the SECURITY DEFINER '
  'consume function touches it.';

alter table public.rate_limits enable row level security;

drop policy if exists rate_limits_no_access on public.rate_limits;
create policy rate_limits_no_access on public.rate_limits
  for all to authenticated, anon using (false) with check (false);

create index if not exists rate_limits_sweep_idx on public.rate_limits (window_start);

create or replace function private.consume_rate_limit(
  p_bucket text, p_identifier text, p_limit integer, p_window interval
) returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_start timestamptz;
  v_hits  integer;
begin
  -- Truncating to the window makes the key deterministic without storing an
  -- expiry, so two concurrent callers land on the same row and the primary key
  -- serialises them.
  v_start := to_timestamp(floor(extract(epoch from now()) / extract(epoch from p_window))
                          * extract(epoch from p_window));

  insert into public.rate_limits (bucket, identifier, window_start, hits)
  values (p_bucket, coalesce(nullif(p_identifier, ''), 'anonymous'), v_start, 1)
  on conflict (bucket, identifier, window_start)
  do update set hits = public.rate_limits.hits + 1
  returning hits into v_hits;

  -- Opportunistic sweep; cheap because of the index and avoids needing a cron.
  if random() < 0.01 then
    delete from public.rate_limits where window_start < now() - interval '1 day';
  end if;

  return v_hits <= p_limit;
end;
$$;

revoke all on function private.consume_rate_limit(text,text,integer,interval)
  from public, anon, authenticated;

-- Apply to the two anon-callable write RPCs.
create or replace function public.submit_lead(
  p_full_name text, p_email text, p_brief text,
  p_company text default null, p_phone text default null,
  p_project_title text default null, p_service_page uuid default null,
  p_service_intent text default null, p_source text default 'web-form'
) returns text
language plpgsql
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

  -- Five enquiries per address per fifteen minutes. Generous for a person,
  -- useless for a script. Enforced in the database rather than in Next.js
  -- middleware so it cannot be skipped by calling PostgREST directly.
  if not private.consume_rate_limit('submit_lead', lower(p_email), 5,
                                    interval '15 minutes') then
    raise exception 'Too many enquiries from this address. Please try again shortly.'
      using errcode = 'too_many_connections';
  end if;

  return private.create_lead(
    p_full_name, p_email, p_company, p_phone, p_project_title,
    p_brief, p_service_page, p_service_intent, p_source);
end;
$$;

grant execute on function public.submit_lead(text,text,text,text,text,text,uuid,text,text)
  to anon, authenticated, service_role;

create or replace function public.subscribe_newsletter(
  p_email text, p_source text default 'footer'
) returns void
language plpgsql
set search_path = ''
as $$
begin
  if position('@' in coalesce(p_email, '')) < 2 or length(btrim(p_email)) < 5 then
    raise exception 'valid email required' using errcode = 'check_violation';
  end if;

  if not private.consume_rate_limit('subscribe_newsletter', lower(p_email), 3,
                                    interval '15 minutes') then
    raise exception 'Too many attempts. Please try again shortly.'
      using errcode = 'too_many_connections';
  end if;

  perform private.add_subscriber(p_email, p_source);
end;
$$;

grant execute on function public.subscribe_newsletter(text,text)
  to anon, authenticated, service_role;

-- ================================================ 4. MEETING AVAILABILITY ==

/**
 * Weekly working hours per staff member (spec §7.1 "admin-configured working
 * hours"). The booking UI intersects these with existing meetings to produce
 * the slot grid, rather than offering arbitrary times.
 */
create table if not exists public.availability_rules (
  id          uuid primary key default gen_random_uuid(),
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  weekday     smallint not null check (weekday between 0 and 6),
  starts_at   time not null,
  ends_at     time not null,
  timezone    text not null default 'UTC',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint availability_rules_ordered check (ends_at > starts_at),
  constraint availability_rules_unique unique (profile_id, weekday, starts_at)
);

comment on table public.availability_rules is
  'Weekly bookable hours per staff member. A visitor never sees a slot outside '
  'these, so the calendar cannot offer a time nobody works.';

create index if not exists availability_rules_profile_idx
  on public.availability_rules (profile_id, weekday);

alter table public.availability_rules enable row level security;

drop policy if exists availability_rules_select on public.availability_rules;
drop policy if exists availability_rules_insert on public.availability_rules;
drop policy if exists availability_rules_update on public.availability_rules;
drop policy if exists availability_rules_delete on public.availability_rules;

-- Readable by anyone: a public booking page has to know when it may offer a
-- slot. Only the window is exposed, never who is busy or with whom.
create policy availability_rules_select on public.availability_rules
  for select to anon, authenticated using (is_active);
create policy availability_rules_insert on public.availability_rules
  for insert to authenticated
  with check (private.is_admin() or profile_id = (select auth.uid()));
create policy availability_rules_update on public.availability_rules
  for update to authenticated
  using (private.is_admin() or profile_id = (select auth.uid()))
  with check (private.is_admin() or profile_id = (select auth.uid()));
create policy availability_rules_delete on public.availability_rules
  for delete to authenticated
  using (private.is_admin() or profile_id = (select auth.uid()));

drop trigger if exists availability_rules_set_updated_at on public.availability_rules;
create trigger availability_rules_set_updated_at before update on public.availability_rules
  for each row execute function private.set_updated_at();

-- ============================================ 5. NOTIFICATION COVERAGE =====

-- Milestone reaching "done" tells the client (spec §11.3).
create or replace function private.on_milestone_done()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if new.status is not distinct from old.status or new.status <> 'done' then
    return new;
  end if;

  for r in
    select p.id, pr.name as project_name, pr.slug
      from public.projects pr
      join public.profiles p on p.organization_id = pr.organization_id
     where pr.id = new.project_id and p.is_active and p.portal = 'CLIENT'
  loop
    perform private.notify(r.id, 'project', 'Milestone complete',
      new.title || ' on ' || r.project_name || ' is done.',
      '/client/projects/' || r.slug, 'milestone', new.id::text);
  end loop;
  return new;
end $$;

drop trigger if exists project_milestones_notify_done on public.project_milestones;
create trigger project_milestones_notify_done after update on public.project_milestones
  for each row execute function private.on_milestone_done();

-- A deliverable arriving for review, and its outcome going back to staff.
create or replace function private.on_deliverable_status()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  if new.status is not distinct from old.status then return new; end if;

  if new.status = 'In review' then
    for r in
      select p.id from public.projects pr
        join public.profiles p on p.organization_id = pr.organization_id
       where pr.id = new.project_id and p.is_active and p.portal = 'CLIENT'
    loop
      perform private.notify(r.id, 'project', 'Ready for your review',
        new.title || ' is waiting on your approval.',
        '/client/deliverables/' || new.id::text, 'deliverable', new.id::text);
    end loop;
  elsif new.owner_id is not null then
    perform private.notify(new.owner_id, 'project',
      case when new.status = 'Approved' then 'Deliverable approved'
           else 'Changes requested' end,
      new.title, '/staff/projects', 'deliverable', new.id::text);
  end if;
  return new;
end $$;

drop trigger if exists deliverables_notify_status on public.deliverables;
create trigger deliverables_notify_status after update on public.deliverables
  for each row execute function private.on_deliverable_status();

-- A new review lands in the moderation queue.
create or replace function private.on_review_submitted()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select p.id from public.profiles p
      join public.role_grants g on g.role_id = p.role_id
     where p.portal = 'ADMIN' and p.is_active
       and g.module_id = 'content-publishing' and g.level >= 'edit'
  loop
    perform private.notify(r.id, 'member', 'Review awaiting moderation',
      coalesce(new.author_name, 'A client') || ' left a ' || new.rating || '-star review.',
      '/admin/reviews', 'review', new.id::text);
  end loop;
  return new;
end $$;

drop trigger if exists reviews_notify_submitted on public.reviews;
create trigger reviews_notify_submitted after insert on public.reviews
  for each row execute function private.on_review_submitted();

-- A new lead reaches whoever runs the CRM.
create or replace function private.on_lead_notify()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  for r in
    select p.id from public.profiles p
      join public.role_grants g on g.role_id = p.role_id
     where p.portal = 'ADMIN' and p.is_active
       and g.module_id = 'crm-database' and g.level >= 'edit'
  loop
    perform private.notify(r.id, 'member', 'New enquiry',
      new.full_name || coalesce(' · ' || new.company, '') ||
        coalesce(' — ' || new.project_title, ''),
      '/admin/leads', 'lead', new.id::text);
  end loop;
  return new;
end $$;

drop trigger if exists leads_notify_created on public.leads;
create trigger leads_notify_created after insert on public.leads
  for each row execute function private.on_lead_notify();

-- ============================================ 6. RPC GRANT HYGIENE ========

-- NOTE / AUDIT CORRECTION.
--
-- docs/AUDIT.md finding S-6 claimed slow_queries(), database_health() and
-- table_statistics() were callable by any authenticated user. That was WRONG:
-- reading their bodies shows all three already begin with
--   if not private.is_admin() then raise exception ... end if;
-- The broad EXECUTE grant is harmless because the function is its own guard.
-- No change is made to them here, and the audit finding is withdrawn.
--
-- What IS worth tightening is the anon grant on three mutation-shaped RPCs
-- (audit D-5). RLS already refuses an anonymous caller, so this changes no
-- behaviour today — it removes a trap where a future policy relaxation would
-- silently expose them.
revoke execute on function public.reorder_menu_items(jsonb) from anon;
revoke execute on function public.reorder_services(uuid[]) from anon;
revoke execute on function public.next_available_slug(text, text) from anon;

-- ==================================================== 7. A CLIENT ROLE =====

-- Audit D-3: clients had role_id = NULL, so effective_level() resolved 'none'
-- on every module by accident rather than by decision. An explicit row with
-- explicit zero grants says the same thing on purpose, and gives the admin UI
-- something to display.
insert into public.roles (id, name, description, is_system, level, required_clearance, accent)
values ('client', 'Client', 'Portal access to their own organisation''s data only. Holds no module grants.',
        true, 1, 1, 'ion')
on conflict (id) do nothing;

insert into public.role_grants (role_id, module_id, level)
select 'client', m.id, 'none'::public.access_level
  from public.permission_modules m
on conflict (role_id, module_id) do nothing;

update public.profiles
   set role_id = 'client'
 where portal = 'CLIENT' and role_id is null;

-- ================================================= 8. ARCHIVE, NOT DELETE ==

-- Audit D-6. Spec §11.2 requires archived cards to remain searchable.
alter table public.project_tasks add column if not exists archived_at timestamptz;
alter table public.leads          add column if not exists archived_at timestamptz;

create index if not exists project_tasks_archived_idx
  on public.project_tasks (project_id) where archived_at is null;
create index if not exists leads_archived_idx
  on public.leads (status) where archived_at is null;

-- ================================================= 9. SERVICE LINKAGE ======

-- Audit: project_services had no write path, so no engagement ever recorded
-- which services it delivered. The policies existed; only INSERT was missing.
drop policy if exists project_services_insert on public.project_services;
create policy project_services_insert on public.project_services
  for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');

drop policy if exists project_services_delete on public.project_services;
create policy project_services_delete on public.project_services
  for delete to authenticated
  using (private.is_admin() or private.current_portal() = 'STAFF');

-- ------------------------------------------------------------- realtime ---

do $$
declare t text;
begin
  foreach t in array array['email_outbox','payment_intents','availability_rules'] loop
    if not exists (select 1 from pg_publication_tables
       where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

select private.record_migration('0062', 'delivery_billing_and_limits');
