-- Recruiter-to-VA conversations are separate from client chat.
create table public.recruiter_va_threads (
  id uuid primary key default gen_random_uuid(),
  recruiter_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  last_message_at timestamptz,
  unique (recruiter_id, va_id)
);

create table public.recruiter_va_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.recruiter_va_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index recruiter_va_threads_va_idx on public.recruiter_va_threads(va_id, last_message_at desc);
create index recruiter_va_messages_thread_idx on public.recruiter_va_messages(thread_id, created_at);

alter table public.recruiter_va_threads enable row level security;
alter table public.recruiter_va_messages enable row level security;
revoke all on public.recruiter_va_threads from public, anon, authenticated;
revoke all on public.recruiter_va_messages from public, anon, authenticated;
grant all on public.recruiter_va_threads to service_role;
grant all on public.recruiter_va_messages to service_role;

create function public.validate_recruiter_va_thread() returns trigger
language plpgsql set search_path = 'public' as $function$
begin
  if not exists (select 1 from public.profiles where id = new.recruiter_id and role = 'recruiter'::public.user_role and account_status = 'active')
    or not exists (select 1 from public.profiles where id = new.va_id and role = 'va'::public.user_role) then
    raise exception 'A recruiter and VA are required';
  end if;
  return new;
end;
$function$;
create trigger validate_recruiter_va_thread before insert or update on public.recruiter_va_threads
for each row execute function public.validate_recruiter_va_thread();

create function public.validate_recruiter_va_message() returns trigger
language plpgsql set search_path = 'public' as $function$
begin
  if not exists (
    select 1 from public.recruiter_va_threads
    where id = new.thread_id and new.sender_id in (recruiter_id, va_id)
  ) then
    raise exception 'Sender is not a participant';
  end if;
  return new;
end;
$function$;
create trigger validate_recruiter_va_message before insert on public.recruiter_va_messages
for each row execute function public.validate_recruiter_va_message();
