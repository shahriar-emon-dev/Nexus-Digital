-- =============================================================================
-- 0049_messaging_and_notifications.sql
--
-- Messaging and notifications had a fully designed UI and no table anywhere in
-- the database. Every message the portal appeared to send was discarded, and
-- "notifications" was a static array. These are the tables behind them.
--
-- SAFE TO RE-RUN. Requires 0034 (roles/helpers) and the projects schema.
-- =============================================================================

create table if not exists public.message_channels (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (length(btrim(name)) between 1 and 80),
  purpose         text,
  -- A channel belongs to a project, or to an organisation as a direct line.
  project_id      uuid references public.projects (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  is_direct       boolean not null default false,
  created_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint message_channels_scoped check (project_id is not null or organization_id is not null)
);

create table if not exists public.channel_participants (
  channel_id   uuid not null references public.message_channels (id) on delete cascade,
  profile_id   uuid not null references public.profiles (id) on delete cascade,
  -- Unread counts are DERIVED from this marker rather than stored as an integer,
  -- so a badge can never drift from the messages actually in the channel.
  last_read_at timestamptz not null default 'epoch',
  created_at   timestamptz not null default now(),
  primary key (channel_id, profile_id)
);

create table if not exists public.messages (
  id         uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.message_channels (id) on delete cascade,
  author_id  uuid references public.profiles (id) on delete set null,
  -- The same block shape the renderer already understands: text, code, image, file.
  blocks     jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  edited_at  timestamptz,
  constraint messages_blocks_is_array check (jsonb_typeof(blocks) = 'array')
);

create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  kind         text not null default 'info',
  title        text not null,
  body         text,
  href         text,
  entity_type  text,
  entity_id    text,
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists message_channels_project_idx  on public.message_channels (project_id);
create index if not exists message_channels_org_idx      on public.message_channels (organization_id);
create index if not exists message_channels_creator_idx  on public.message_channels (created_by);
create index if not exists channel_participants_profile_idx on public.channel_participants (profile_id);
create index if not exists messages_channel_idx  on public.messages (channel_id, created_at desc);
create index if not exists messages_author_idx   on public.messages (author_id);
create index if not exists notifications_inbox_idx  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx on public.notifications (recipient_id) where read_at is null;

drop trigger if exists message_channels_set_updated_at on public.message_channels;
create trigger message_channels_set_updated_at before update on public.message_channels
  for each row execute function private.set_updated_at();

-- Membership is the single question every messaging policy asks, so it is one
-- definer function rather than the same subquery in six places. Without the
-- definer the participants policy would have to read participants in order to
-- decide who may read participants.
create or replace function private.in_channel(p_channel uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.channel_participants cp
    where cp.channel_id = p_channel and cp.profile_id = auth.uid());
$$;

alter table public.message_channels     enable row level security;
alter table public.channel_participants enable row level security;
alter table public.messages             enable row level security;
alter table public.notifications        enable row level security;

drop policy if exists message_channels_select on public.message_channels;
create policy message_channels_select on public.message_channels
  for select to authenticated
  using (private.is_admin() or private.in_channel(id));

drop policy if exists message_channels_insert on public.message_channels;
create policy message_channels_insert on public.message_channels
  for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');

drop policy if exists message_channels_update on public.message_channels;
create policy message_channels_update on public.message_channels
  for update to authenticated
  using (private.is_admin()) with check (private.is_admin());

drop policy if exists channel_participants_select on public.channel_participants;
create policy channel_participants_select on public.channel_participants
  for select to authenticated
  using (private.is_admin() or private.in_channel(channel_id));

drop policy if exists channel_participants_insert on public.channel_participants;
create policy channel_participants_insert on public.channel_participants
  for insert to authenticated
  with check (private.is_admin() or private.current_portal() = 'STAFF');

-- Marking your own channel read. Nobody may move somebody else's marker.
drop policy if exists channel_participants_update_self on public.channel_participants;
create policy channel_participants_update_self on public.channel_participants
  for update to authenticated
  using (profile_id = auth.uid()) with check (profile_id = auth.uid());

drop policy if exists channel_participants_delete on public.channel_participants;
create policy channel_participants_delete on public.channel_participants
  for delete to authenticated using (private.is_admin());

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select to authenticated
  using (private.is_admin() or private.in_channel(channel_id));

-- author_id is pinned to the caller. Without this a channel member could post
-- a message attributed to anyone else in the channel.
drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert to authenticated
  with check (author_id = auth.uid() and private.in_channel(channel_id));

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
  for update to authenticated
  using (author_id = auth.uid()) with check (author_id = auth.uid());

drop policy if exists messages_delete on public.messages;
create policy messages_delete on public.messages
  for delete to authenticated
  using (author_id = auth.uid() or private.is_admin());

-- A notification is addressed to exactly one person, and only they may see it.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (recipient_id = auth.uid());

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications
  for delete to authenticated using (recipient_id = auth.uid());

-- DELIBERATELY NO INSERT POLICY. Notifications are raised by triggers and
-- definer functions, never by a browser. A client that can write into somebody
-- else's inbox is a phishing primitive.

do $$
declare t text;
begin
  foreach t in array array['message_channels','channel_participants','messages','notifications'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;

select private.record_migration('0049', 'messaging_and_notifications');
