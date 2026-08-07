-- =============================================================================
-- 0056_newsletter_subscribers.sql
--
-- The footer newsletter form validated the address, rendered "You're on the
-- list", and threw it away — the same defect the contact form had before 0039,
-- found while verifying the marketing-copy fixes rather than by reading the
-- code. Every signup the site has ever taken is gone.
--
-- SAFE TO RE-RUN. Requires 0035 (effective_level).
-- =============================================================================

create table if not exists public.newsletter_subscribers (
  id              uuid primary key default gen_random_uuid(),
  email           text not null check (position('@' in email) > 1),
  source          text not null default 'footer',
  confirmed_at    timestamptz,
  unsubscribed_at timestamptz,
  created_at      timestamptz not null default now()
);

-- Case-insensitive: Foo@x.com and foo@x.com are one subscriber, not two.
create unique index if not exists newsletter_subscribers_email_key
  on public.newsletter_subscribers (lower(email));

create index if not exists newsletter_subscribers_created_idx
  on public.newsletter_subscribers (created_at desc);

comment on table public.newsletter_subscribers is
  'Newsletter signups. Anonymous visitors may subscribe through the RPC only; '
  'reading the list requires a CRM grant so it cannot be harvested.';

alter table public.newsletter_subscribers enable row level security;

drop policy if exists newsletter_select_crm on public.newsletter_subscribers;
create policy newsletter_select_crm on public.newsletter_subscribers
  for select to authenticated
  using (private.effective_level('crm-database') >= 'view');

drop policy if exists newsletter_update_crm on public.newsletter_subscribers;
create policy newsletter_update_crm on public.newsletter_subscribers
  for update to authenticated
  using (private.effective_level('crm-database') >= 'edit')
  with check (private.effective_level('crm-database') >= 'edit');

drop policy if exists newsletter_delete_crm on public.newsletter_subscribers;
create policy newsletter_delete_crm on public.newsletter_subscribers
  for delete to authenticated
  using (private.effective_level('crm-database') >= 'admin');

-- NO INSERT POLICY, for the same reason as leads: subscribing goes through the
-- RPC below. A direct anon insert would need a SELECT policy to return anything,
-- and anon must not be able to read a subscriber list at all.
create or replace function private.add_subscriber(p_email text, p_source text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.newsletter_subscribers (email, source)
  values (lower(btrim(p_email)), coalesce(nullif(btrim(p_source), ''), 'footer'))
  -- Subscribing twice is not an error a visitor should ever see. It is also a
  -- disclosure question: "already subscribed" confirms an address is on the list.
  on conflict (lower(email)) do nothing;
end $$;

create or replace function public.subscribe_newsletter(
  p_email text,
  p_source text default 'footer'
) returns void language plpgsql security invoker set search_path = '' as $$
begin
  -- Validated again here: the browser is not a trustworthy validator, and this
  -- function is reachable directly over the API.
  if position('@' in coalesce(p_email, '')) < 2 or length(btrim(p_email)) < 5 then
    raise exception 'valid email required' using errcode = 'check_violation';
  end if;
  perform private.add_subscriber(p_email, p_source);
end $$;

comment on function public.subscribe_newsletter is
  'Records a newsletter signup. Anon may call this and still cannot read the list.';

revoke all on function private.add_subscriber(text, text) from public, anon, authenticated;
grant execute on function private.add_subscriber(text, text) to anon, authenticated;
grant execute on function public.subscribe_newsletter(text, text) to anon, authenticated;

select private.record_migration('0056', 'newsletter_subscribers');
