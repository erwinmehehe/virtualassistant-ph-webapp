-- Enforce the agency communication rule:
-- clients communicate with recruiters, never directly with Virtual Assistants.
-- Preserve legacy conversation rows for audit/history, but remove authenticated
-- access so the old client<->VA channel cannot be used.

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

drop policy if exists "conversation participants" on public.conversations;
drop policy if exists "message participants read" on public.messages;
drop policy if exists "message participants send" on public.messages;

revoke all on public.conversations from anon, authenticated;
revoke all on public.messages from anon, authenticated;

create table if not exists public.client_recruiter_threads (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  recruiter_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_message_at timestamptz,
  constraint client_recruiter_threads_client_unique unique (client_id)
);

create table if not exists public.client_recruiter_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.client_recruiter_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists client_recruiter_threads_recruiter_idx
  on public.client_recruiter_threads(recruiter_id, coalesce(last_message_at, created_at) desc);

create index if not exists client_recruiter_messages_thread_created_idx
  on public.client_recruiter_messages(thread_id, created_at);

create index if not exists client_recruiter_messages_unread_idx
  on public.client_recruiter_messages(thread_id, created_at)
  where read_at is null;

alter table public.client_recruiter_threads enable row level security;
alter table public.client_recruiter_messages enable row level security;

revoke all on public.client_recruiter_threads from public, anon, authenticated;
revoke all on public.client_recruiter_messages from public, anon, authenticated;
grant all on public.client_recruiter_threads to service_role;
grant all on public.client_recruiter_messages to service_role;

create or replace function public.validate_client_recruiter_thread()
returns trigger
language plpgsql
security definer
set search_path='public'
as $function$
begin
  if not exists (
    select 1 from public.profiles
    where id = new.client_id and role = 'client'::public.user_role
  ) then
    raise exception 'client_recruiter_threads.client_id must belong to a client';
  end if;

  if new.recruiter_id is not null and not exists (
    select 1 from public.profiles
    where id = new.recruiter_id and role = 'recruiter'::public.user_role
  ) then
    raise exception 'client_recruiter_threads.recruiter_id must belong to a recruiter';
  end if;

  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists validate_client_recruiter_thread_trigger on public.client_recruiter_threads;
create trigger validate_client_recruiter_thread_trigger
before insert or update on public.client_recruiter_threads
for each row execute function public.validate_client_recruiter_thread();

create or replace function public.validate_client_recruiter_message()
returns trigger
language plpgsql
security definer
set search_path='public'
as $function$
declare
  thread_client uuid;
  thread_recruiter uuid;
  sender_role public.user_role;
begin
  select client_id, recruiter_id
    into thread_client, thread_recruiter
  from public.client_recruiter_threads
  where id = new.thread_id;

  if thread_client is null then
    raise exception 'Chat thread was not found';
  end if;

  select role into sender_role
  from public.profiles
  where id = new.sender_id;

  if sender_role = 'client'::public.user_role then
    if new.sender_id <> thread_client then
      raise exception 'Client is not a participant in this chat';
    end if;
  elsif sender_role = 'recruiter'::public.user_role then
    if thread_recruiter is not null and new.sender_id <> thread_recruiter then
      raise exception 'Recruiter is not assigned to this chat';
    end if;
  else
    raise exception 'Only a client or recruiter can send chat messages';
  end if;

  return new;
end;
$function$;

drop trigger if exists validate_client_recruiter_message_trigger on public.client_recruiter_messages;
create trigger validate_client_recruiter_message_trigger
before insert on public.client_recruiter_messages
for each row execute function public.validate_client_recruiter_message();

comment on table public.client_recruiter_threads is
  'Private in-app conversation between one client and the recruiting team/assigned recruiter. VAs are never participants.';
comment on table public.client_recruiter_messages is
  'Messages inside recruiter-client chat threads. VAs cannot send or read these messages.';
