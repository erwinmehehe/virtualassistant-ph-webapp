alter table public.va_profiles
  add column if not exists address text,
  add column if not exists address_resume_checked_at timestamptz,
  add column if not exists address_resume_status text;

alter table public.va_profiles
  drop constraint if exists va_profiles_address_resume_status_check;

alter table public.va_profiles
  add constraint va_profiles_address_resume_status_check
  check (
    address_resume_status is null
    or address_resume_status in ('saved','review','no_match','unsupported','error')
  );

create or replace view public.recruiter_va_registration_health as
select
  p.id as va_id,
  (au.email_confirmed_at is not null) as email_confirmed,
  au.last_sign_in_at,
  au.created_at as auth_created_at,
  (v.address is not null and btrim(v.address) <> '') as has_private_address,
  (v.resume_path is not null and btrim(v.resume_path) <> '') as has_resume,
  v.address_resume_status,
  v.address_resume_checked_at,
  cs.completion_score,
  case
    when au.email_confirmed_at is null then 'email_unconfirmed'
    when cs.completion_score = 0 then 'never_started'
    when cs.completion_score < 80 then 'profile_incomplete'
    else 'ready'
  end as registration_health
from public.profiles p
join auth.users au on au.id = p.id
left join public.va_profiles v on v.user_id = p.id
cross join lateral (
  select
      case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end
    + case when coalesce(length(btrim(v.headline)),0) >= 8 then 10 else 0 end
    + case when coalesce(length(btrim(v.bio)),0) >= 80 then 15 else 0 end
    + case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end
    + case when cardinality(coalesce(v.skills,'{}'::text[])) >= 5 then 15 else 0 end
    + case when cardinality(coalesce(v.tools,'{}'::text[])) >= 3 then 5 else 0 end
    + case when coalesce(v.years_experience,0) >= 1 then 10 else 0 end
    + case when coalesce(v.weekly_hours,0) >= 1 then 10 else 0 end
    + case when coalesce(v.hourly_rate,0) >= 5 then 10 else 0 end
    + case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end
    + case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end
    as completion_score
) cs
where p.role = 'va'::public.user_role
  and not (
    coalesce(au.raw_user_meta_data ->> 'role','') = ''
    and (
      au.raw_user_meta_data ->> 'account_type' = 'training'
      or au.raw_app_meta_data ->> 'account_type' = 'training'
    )
  );

revoke all on public.recruiter_va_registration_health from public, anon, authenticated;
grant select on public.recruiter_va_registration_health to service_role;

comment on view public.recruiter_va_registration_health is
  'Service-role-only recruiter health data for VA registration rescue and private-address completeness.';

comment on column public.va_profiles.address_resume_status is
  'Private resume address backfill state: saved, review, no_match, unsupported, or error.';
