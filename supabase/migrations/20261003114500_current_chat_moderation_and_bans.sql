-- Restore moderation against the current managed-chat architecture.
-- Browser roles cannot read flags. Flags are advisory for admins; no automatic bans.

alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text,
  add column if not exists banned_by uuid references public.profiles(id) on delete set null;

create table if not exists public.message_flags (
  id uuid primary key default gen_random_uuid(),
  source_type text not null check (source_type in ('client_recruiter','recruiter_va')),
  source_message_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body_snapshot text not null,
  matched_terms text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending','dismissed','actioned')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  unique(source_type, source_message_id)
);

alter table public.message_flags enable row level security;
revoke all on public.message_flags from public, anon, authenticated;
grant all on public.message_flags to service_role;

create index if not exists message_flags_pending_idx
  on public.message_flags(status, created_at desc)
  where status = 'pending';

create or replace function public.flag_managed_chat_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized text := lower(coalesce(new.body, ''));
  hits text[] := '{}';
begin
  if normalized ~ '(whatsapp|telegram|skype|viber|signal)' then hits := array_append(hits, 'direct-contact-app'); end if;
  if normalized ~ '(gcash|paymaya|maya wallet|payoneer|wise|western union|bank transfer|instapay|pesonet)' then hits := array_append(hits, 'off-platform-payment'); end if;
  if normalized ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' then hits := array_append(hits, 'email-address'); end if;
  if normalized ~ '(\+?63|0)9[0-9][0-9][ -]?[0-9]{3}[ -]?[0-9]{4}' then hits := array_append(hits, 'phone-number'); end if;
  if normalized ~ '(linkedin\.com|facebook\.com|fb\.com|instagram\.com|t\.me/|wa\.me/)' then hits := array_append(hits, 'external-contact-link'); end if;

  if cardinality(hits) > 0 then
    insert into public.message_flags(source_type, source_message_id, sender_id, body_snapshot, matched_terms)
    values (
      case when tg_table_name = 'client_recruiter_messages' then 'client_recruiter' else 'recruiter_va' end,
      new.id,
      new.sender_id,
      left(new.body, 4000),
      hits
    )
    on conflict (source_type, source_message_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.flag_managed_chat_message() from public, anon, authenticated;
grant execute on function public.flag_managed_chat_message() to service_role;

drop trigger if exists trg_flag_client_recruiter_message on public.client_recruiter_messages;
create trigger trg_flag_client_recruiter_message
after insert on public.client_recruiter_messages
for each row execute function public.flag_managed_chat_message();

drop trigger if exists trg_flag_recruiter_va_message on public.recruiter_va_messages;
create trigger trg_flag_recruiter_va_message
after insert on public.recruiter_va_messages
for each row execute function public.flag_managed_chat_message();

comment on table public.message_flags is
  'Admin-only moderation queue for possible contact/payment circumvention in managed chats.';
