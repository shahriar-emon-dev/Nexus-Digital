-- =============================================================================
-- 0052_notification_triggers.sql
--
-- Notifications are raised by the database, not by the browser.
--
-- 0049 deliberately gave public.notifications no INSERT policy. This file is
-- the other half of that decision: the events that legitimately produce a
-- notification each get a trigger, and the single definer that writes them
-- refuses to notify you about your own action or to write to an inactive account.
--
-- SAFE TO RE-RUN. Requires 0049, 0050 and 0051.
-- =============================================================================

create or replace function private.notify(
  p_recipient uuid, p_kind text, p_title text,
  p_body text default null, p_href text default null,
  p_entity_type text default null, p_entity_id text default null
) returns void language plpgsql security definer set search_path = '' as $$
begin
  -- Never notify someone about something they did themselves, and never write
  -- into a deactivated or deleted account's inbox.
  if p_recipient is null or p_recipient = auth.uid() then return; end if;
  if not exists (select 1 from public.profiles p where p.id = p_recipient and p.is_active) then
    return;
  end if;

  insert into public.notifications (recipient_id, kind, title, body, href, entity_type, entity_id)
  values (p_recipient, p_kind, p_title, p_body, p_href, p_entity_type, p_entity_id);
end $$;

revoke all on function private.notify(uuid,text,text,text,text,text,text) from public, anon, authenticated;

create or replace function private.on_message_created()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  r         record;
  v_author  text;
  v_channel text;
begin
  select coalesce(full_name, email) into v_author from public.profiles where id = new.author_id;
  select name into v_channel from public.message_channels where id = new.channel_id;

  for r in select profile_id from public.channel_participants
            where channel_id = new.channel_id and profile_id <> new.author_id
  loop
    perform private.notify(
      r.profile_id, 'message',
      coalesce(v_author, 'Someone') || ' posted in #' || coalesce(v_channel, 'a channel'),
      left(coalesce(new.blocks -> 0 ->> 'text', 'New message'), 140),
      '/client/messages', 'message', new.id::text);
  end loop;
  return new;
end $$;

drop trigger if exists messages_notify on public.messages;
create trigger messages_notify after insert on public.messages
  for each row execute function private.on_message_created();

create or replace function private.on_meeting_participant_added()
returns trigger language plpgsql security definer set search_path = '' as $$
declare m record;
begin
  select title, starts_at into m from public.meetings where id = new.meeting_id;
  perform private.notify(
    new.profile_id, 'meeting',
    'You were invited to ' || coalesce(m.title, 'a meeting'),
    to_char(m.starts_at, 'Mon DD, HH24:MI'),
    '/client/meetings', 'meeting', new.meeting_id::text);
  return new;
end $$;

drop trigger if exists meeting_participants_notify on public.meeting_participants;
create trigger meeting_participants_notify after insert on public.meeting_participants
  for each row execute function private.on_meeting_participant_added();

create or replace function private.on_ticket_reply()
returns trigger language plpgsql security definer set search_path = '' as $$
declare t record;
begin
  select opened_by, assignee_id, subject, reference into t
    from public.support_tickets where id = new.ticket_id;

  -- An internal note goes to the assignee only; the client is never told one
  -- exists, which is the whole point of the flag.
  if new.is_internal = false then
    perform private.notify(t.opened_by, 'support',
      'Reply on ' || coalesce(t.reference, 'your ticket'),
      left(new.body, 140), '/client/support', 'ticket', new.ticket_id::text);
  end if;

  perform private.notify(t.assignee_id, 'support',
    'Reply on ' || coalesce(t.reference, 'a ticket'),
    left(new.body, 140), '/admin/support', 'ticket', new.ticket_id::text);
  return new;
end $$;

drop trigger if exists support_ticket_replies_notify on public.support_ticket_replies;
create trigger support_ticket_replies_notify after insert on public.support_ticket_replies
  for each row execute function private.on_ticket_reply();

create or replace function private.on_task_assigned()
returns trigger language plpgsql security definer set search_path = '' as $$
declare p record;
begin
  -- Only when the assignee actually changes, so editing a title does not
  -- re-notify somebody about work they already know about.
  if new.assignee_id is null
     or (tg_op = 'UPDATE' and new.assignee_id is not distinct from old.assignee_id) then
    return new;
  end if;

  select name, slug into p from public.projects where id = new.project_id;
  perform private.notify(new.assignee_id, 'task',
    'Assigned: ' || new.title, coalesce(p.name, ''),
    '/staff/projects', 'task', new.id::text);
  return new;
end $$;

drop trigger if exists project_tasks_notify_assignee on public.project_tasks;
create trigger project_tasks_notify_assignee
  after insert or update of assignee_id on public.project_tasks
  for each row execute function private.on_task_assigned();

select private.record_migration('0052', 'notification_triggers');
