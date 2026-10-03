-- Reconcile moderation with the production managed-chat schema.
-- Safe on environments where the Oct 3 moderation hotfix was already applied.

alter table public.profiles
  add column if not exists banned_at timestamptz,
  add column if not exists banned_reason text,
  add column if not exists banned_by uuid references public.profiles(id) on delete set null;

create table if not exists public.message_flags (
  id uuid primary key default gen_random_uuid(),
  channel text not null check (channel in ('client_recruiter','recruiter_va')),
  message_id uuid not null,
  thread_id uuid not null,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  matched_terms text[] not null default '{}',
  body_snapshot text not null,
  status text not null default 'pending' check (status in ('pending','dismissed','actioned')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(channel, message_id)
);

alter table public.message_flags enable row level security;
revoke all on public.message_flags from public, anon, authenticated;
grant all on public.message_flags to service_role;

drop policy if exists "message_flags_server_only" on public.message_flags;
create policy "message_flags_server_only"
on public.message_flags
for all
to anon, authenticated
using (false)
with check (false);

create index if not exists message_flags_status_created_idx
  on public.message_flags(status, created_at desc);
create index if not exists message_flags_sender_created_idx
  on public.message_flags(sender_id, created_at desc);
create index if not exists message_flags_reviewed_by_idx
  on public.message_flags(reviewed_by)
  where reviewed_by is not null;
create index if not exists profiles_banned_by_idx
  on public.profiles(banned_by)
  where banned_by is not null;

create or replace function private.message_circumvention_terms(p_body text)
returns text[]
language plpgsql
immutable
set search_path = ''
as $function$
declare
  normalized text := lower(coalesce(p_body, ''));
  hits text[] := '{}'::text[];
begin
  if normalized ~ '[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}' then
    hits := array_append(hits, 'email');
  end if;
  if normalized ~ '(\+?63|0)[[:space:]().-]*9[0-9[:space:]().-]{8,12}' then
    hits := array_append(hits, 'phone');
  end if;
  if normalized ~ '(whats[[:space:]_-]*app|telegram|viber|skype|discord|facebook[[:space:]_-]*messenger)' then
    hits := array_append(hits, 'external_contact_channel');
  end if;
  if normalized ~ '(linkedin\.com/(in|pub)/|facebook\.com/|t\.me/|wa\.me/)' then
    hits := array_append(hits, 'external_profile_link');
  end if;
  if normalized ~ '(pay[[:space:]_-]*me[[:space:]_-]*direct|direct[[:space:]_-]*payment|hire[[:space:]_-]*me[[:space:]_-]*direct|direct[[:space:]_-]*hire|outside[[:space:]_-]*(the[[:space:]_-]*)?(platform|vaph)|off[[:space:]_-]*platform)' then
    hits := array_append(hits, 'circumvention_language');
  end if;
  if normalized ~ '(gcash|paymaya|maya[[:space:]_-]*wallet|paypal|payoneer|wise[[:space:]_-]*(account|transfer)|bank[[:space:]_-]*transfer)' then
    hits := array_append(hits, 'external_payment');
  end if;
  return hits;
end;
$function$;

create or replace function private.flag_current_chat_circumvention()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  hits text[];
  resolved_channel text;
begin
  hits := private.message_circumvention_terms(new.body);
  if coalesce(cardinality(hits), 0) = 0 then
    return new;
  end if;

  resolved_channel := case tg_table_name
    when 'client_recruiter_messages' then 'client_recruiter'
    when 'recruiter_va_messages' then 'recruiter_va'
    else null
  end;
  if resolved_channel is null then return new; end if;

  insert into public.message_flags(
    channel, message_id, thread_id, sender_id, matched_terms, body_snapshot
  )
  values(
    resolved_channel, new.id, new.thread_id, new.sender_id, hits, left(new.body, 4000)
  )
  on conflict (channel, message_id)
  do update set
    matched_terms = excluded.matched_terms,
    body_snapshot = excluded.body_snapshot;

  return new;
end;
$function$;

revoke execute on function private.message_circumvention_terms(text) from public, anon, authenticated;
revoke execute on function private.flag_current_chat_circumvention() from public, anon, authenticated;
grant execute on function private.message_circumvention_terms(text) to service_role;
grant execute on function private.flag_current_chat_circumvention() to service_role;

drop trigger if exists flag_client_recruiter_circumvention on public.client_recruiter_messages;
create trigger flag_client_recruiter_circumvention
after insert on public.client_recruiter_messages
for each row execute function private.flag_current_chat_circumvention();

drop trigger if exists flag_recruiter_va_circumvention on public.recruiter_va_messages;
create trigger flag_recruiter_va_circumvention
after insert on public.recruiter_va_messages
for each row execute function private.flag_current_chat_circumvention();

-- Remove any legacy free bypass. Candidate identity access is paid-only.
update public.job_candidate_access
set access_status = 'locked',
    unlocked_at = null,
    unlocked_by = null,
    payment_reference = null,
    notes = concat_ws(' | ', nullif(notes,''), 'Legacy comped access relocked: paid candidate access is required before client review.')
where access_status = 'comped';
