alter table public.va_profiles
  add column if not exists public_profile_consent boolean not null default false,
  add column if not exists public_profile_consent_at timestamptz,
  add column if not exists public_profile_consent_version text,
  add column if not exists public_profile_consent_withdrawn_at timestamptz;

create table if not exists public.va_public_profile_consent_events (
  id bigint generated always as identity primary key,
  va_id uuid not null references public.profiles(id) on delete cascade,
  consent_version text not null,
  action text not null check (action in ('granted','withdrawn')),
  source text not null default 'va_profile',
  occurred_at timestamptz not null default now()
);

create index if not exists va_public_profile_consent_events_va_id_occurred_idx
  on public.va_public_profile_consent_events (va_id, occurred_at desc);

alter table public.va_public_profile_consent_events enable row level security;
revoke all on table public.va_public_profile_consent_events from anon, authenticated;
grant select, insert on table public.va_public_profile_consent_events to service_role;
grant usage, select on sequence public.va_public_profile_consent_events_id_seq to service_role;

create or replace function public.record_va_public_profile_consent(
  p_va_id uuid,
  p_granted boolean,
  p_version text,
  p_source text default 'va_profile'
)
returns table(public_profile_consent boolean, changed_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_consent boolean;
  current_version text;
  event_time timestamptz := now();
begin
  if p_version is null or btrim(p_version) = '' then
    raise exception 'Consent version is required';
  end if;

  select v.public_profile_consent, v.public_profile_consent_version
    into current_consent, current_version
  from public.va_profiles v
  join public.profiles p on p.id = v.user_id
  where v.user_id = p_va_id and p.role = 'va';

  if not found then
    raise exception 'VA profile not found';
  end if;

  if current_consent is distinct from p_granted
     or (p_granted and current_version is distinct from p_version) then
    update public.va_profiles
      set public_profile_consent = p_granted,
          public_profile_consent_at = case when p_granted then event_time else public_profile_consent_at end,
          public_profile_consent_version = p_version,
          public_profile_consent_withdrawn_at = case when p_granted then null else event_time end,
          updated_at = event_time
    where user_id = p_va_id;

    insert into public.va_public_profile_consent_events (va_id, consent_version, action, source, occurred_at)
    values (p_va_id, p_version, case when p_granted then 'granted' else 'withdrawn' end, coalesce(nullif(btrim(p_source), ''), 'va_profile'), event_time);
  end if;

  return query
  select v.public_profile_consent,
         case when v.public_profile_consent then v.public_profile_consent_at else v.public_profile_consent_withdrawn_at end
  from public.va_profiles v
  where v.user_id = p_va_id;
end;
$$;

revoke all on function public.record_va_public_profile_consent(uuid, boolean, text, text) from public, anon, authenticated;
grant execute on function public.record_va_public_profile_consent(uuid, boolean, text, text) to service_role;
