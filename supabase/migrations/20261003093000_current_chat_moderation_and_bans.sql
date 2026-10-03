-- Rebuild moderation around the current recruiter-mediated chat architecture.
-- Flags are review-only. No account is automatically suspended from keyword matches.

alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists banned_reason text;
alter table public.profiles add column if not exists banned_by uuid references public.profiles(id) on delete set null;

create table if not exists public.communication_flags (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('client_recruiter','recruiter_va')),
  message_id uuid not null,
  thread_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  matched_terms text[] not null default '{}',
  message_excerpt text not null,
  status text not null default 'pending' check (status in ('pending','dismissed','actioned')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(channel,message_id)
);

create index if not exists communication_flags_status_idx
  on public.communication_flags(status,created_at desc);
create index if not exists communication_flags_sender_idx
  on public.communication_flags(sender_id,created_at desc);

alter table public.communication_flags enable row level security;
revoke all on public.communication_flags from public, anon, authenticated;
grant all on public.communication_flags to service_role;

create or replace function public.flag_off_platform_communication()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  sender_role public.user_role;
  content text := lower(coalesce(new.body,''));
  compact text := regexp_replace(lower(coalesce(new.body,'')), '[^a-z0-9@+.]', '', 'g');
  matches text[] := '{}'::text[];
  channel_name text;
begin
  select role into sender_role from public.profiles where id = new.sender_id;
  if sender_role not in ('client'::public.user_role, 'va'::public.user_role) then
    return new;
  end if;

  if content ~* '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' then
    matches := array_append(matches, 'email');
  end if;

  if compact ~ '(\+?63|0)9[0-9]{9}' then
    matches := array_append(matches, 'phone');
  end if;

  if content ~* '(whats?app|telegram|skype|viber|discord|facebook[.]com|messenger|linkedin[.]com|instagram[.]com)' then
    matches := array_append(matches, 'external_contact');
  end if;

  if content ~* '((pay|send|transfer|settle).{0,40}(gcash|maya|paymaya|wise|payoneer|bank transfer|instapay|pesonet)|(gcash|maya|paymaya|wise|payoneer|bank transfer|instapay|pesonet).{0,40}(pay|send|transfer|settle))' then
    matches := array_append(matches, 'direct_payment');
  end if;

  if content ~* '(off[- ]platform|outside (of )?(the )?platform|hire (me|him|her|them) directly|direct hire|bypass.{0,40}(fee|platform)|avoid.{0,40}(fee|platform))' then
    matches := array_append(matches, 'circumvention');
  end if;

  if cardinality(matches) = 0 then
    return new;
  end if;

  channel_name := case tg_table_name
    when 'client_recruiter_messages' then 'client_recruiter'
    when 'recruiter_va_messages' then 'recruiter_va'
    else null
  end;
  if channel_name is null then return new; end if;

  insert into public.communication_flags(
    channel,message_id,thread_id,sender_id,matched_terms,message_excerpt
  ) values (
    channel_name,new.id,new.thread_id,new.sender_id,matches,left(new.body,2000)
  )
  on conflict (channel,message_id) do nothing;

  return new;
end;
$$;

revoke execute on function public.flag_off_platform_communication() from public, anon, authenticated;
grant execute on function public.flag_off_platform_communication() to service_role;

drop trigger if exists flag_off_platform_client_recruiter_message on public.client_recruiter_messages;
create trigger flag_off_platform_client_recruiter_message
after insert on public.client_recruiter_messages
for each row execute function public.flag_off_platform_communication();

drop trigger if exists flag_off_platform_recruiter_va_message on public.recruiter_va_messages;
create trigger flag_off_platform_recruiter_va_message
after insert on public.recruiter_va_messages
for each row execute function public.flag_off_platform_communication();
