-- Training-only accounts must never be treated as VA applicants.
-- Google OAuth creates auth.users before the callback can add account_type=training,
-- so the auth trigger must not default role-less users to VA.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
declare
  requested_role public.user_role;
begin
  if coalesce(new.raw_user_meta_data->>'role', '') not in ('client', 'va') then
    return new;
  end if;

  requested_role := case
    when new.raw_user_meta_data->>'role' = 'client' then 'client'::public.user_role
    else 'va'::public.user_role
  end;

  insert into public.profiles (id, role, full_name)
  values (new.id, requested_role, nullif(new.raw_user_meta_data->>'full_name', ''));

  if requested_role = 'client' then
    insert into public.client_profiles (user_id) values (new.id);
  else
    insert into public.va_profiles (user_id, slug)
    values (new.id, concat('va-', substr(new.id::text, 1, 8)));
    insert into public.va_vetting (va_id) values (new.id);
  end if;

  return new;
end;
$function$;

create or replace view public.recruiter_va_directory as
select
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  p.created_at as account_created_at,
  p.updated_at as account_updated_at,
  p.last_active_at,
  p.email_verified,
  p.identity_verified_at,
  p.account_status,
  v.slug,
  v.headline,
  v.bio,
  v.primary_category,
  v.categories,
  v.skills,
  v.tools,
  v.industries,
  v.years_experience,
  v.weekly_hours,
  v.schedule,
  v.preferred_timezone,
  v.hourly_rate,
  v.portfolio_url,
  v.resume_path,
  v.directory_visible,
  v.availability_status,
  v.updated_at as profile_updated_at,
  coalesce(vv.stage, 'profile'::text) as stage,
  vv.updated_at as vetting_updated_at,
  vv.profile_reviewed_at,
  vv.resume_reviewed_at,
  vv.changes_requested_at,
  case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end
    + case when coalesce(length(btrim(v.headline)), 0) >= 8 then 10 else 0 end
    + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 15 else 0 end
    + case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end
    + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 5 then 15 else 0 end
    + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 3 then 5 else 0 end
    + case when coalesce(v.years_experience, 0) >= 1 then 10 else 0 end
    + case when coalesce(v.weekly_hours, 0) >= 1 then 10 else 0 end
    + case when coalesce(v.hourly_rate, 0::numeric) >= 5::numeric then 10 else 0 end
    + case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end
    + case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end
    as completion_score,
  array_remove(array[
    case when p.avatar_url is null or btrim(p.avatar_url) = '' then 'photo' else null end,
    case when coalesce(length(btrim(v.headline)), 0) < 8 then 'headline' else null end,
    case when coalesce(length(btrim(v.bio)), 0) < 80 then 'bio' else null end,
    case when v.primary_category is null or btrim(v.primary_category) = '' then 'category' else null end,
    case when cardinality(coalesce(v.skills, '{}'::text[])) < 5 then 'skills' else null end,
    case when cardinality(coalesce(v.tools, '{}'::text[])) < 3 then 'tools' else null end,
    case when coalesce(v.years_experience, 0) < 1 then 'experience' else null end,
    case when coalesce(v.weekly_hours, 0) < 1 then 'availability' else null end,
    case when coalesce(v.hourly_rate, 0::numeric) < 5::numeric then 'rate' else null end,
    case when v.resume_path is null or btrim(v.resume_path) = '' then 'resume' else null end,
    case when v.portfolio_url is null or btrim(v.portfolio_url) = '' then 'portfolio' else null end
  ], null::text) as missing_items,
  greatest(p.updated_at, coalesce(v.updated_at, p.updated_at), coalesce(p.last_active_at, p.updated_at)) as last_activity_at,
  vv.edited_since_approval_at,
  ce.total_signal_count as classification_evidence_count,
  case
    when (v.primary_category is not null and btrim(v.primary_category) <> '')
      or cardinality(coalesce(v.categories, '{}'::text[])) > 0
      then 'classified'
    when ce.role_signal_count >= 1 and ce.total_signal_count >= 2
      then 'ready_to_classify'
    else 'incomplete_profile'
  end as classification_status,
  array_remove(array[
    case when coalesce(length(btrim(v.headline)), 0) < 8 then 'headline' else null end,
    case when coalesce(length(btrim(v.bio)), 0) < 80 then 'bio' else null end,
    case when cardinality(coalesce(v.skills, '{}'::text[])) < 3 then 'skills' else null end,
    case when cardinality(coalesce(v.tools, '{}'::text[])) < 2 then 'tools' else null end,
    case when cardinality(coalesce(v.industries, '{}'::text[])) < 1 then 'industries' else null end
  ], null::text) as classification_missing
from public.profiles p
join auth.users au on au.id = p.id
left join public.va_profiles v on v.user_id = p.id
left join public.va_vetting vv on vv.va_id = p.id
cross join lateral (
  select
    (case when coalesce(length(btrim(v.headline)), 0) >= 8 then 1 else 0 end
      + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 1 else 0 end
      + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 3 then 1 else 0 end
      + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 2 then 1 else 0 end) as role_signal_count,
    (case when coalesce(length(btrim(v.headline)), 0) >= 8 then 1 else 0 end
      + case when coalesce(length(btrim(v.bio)), 0) >= 80 then 1 else 0 end
      + case when cardinality(coalesce(v.skills, '{}'::text[])) >= 3 then 1 else 0 end
      + case when cardinality(coalesce(v.tools, '{}'::text[])) >= 2 then 1 else 0 end
      + case when cardinality(coalesce(v.industries, '{}'::text[])) >= 1 then 1 else 0 end) as total_signal_count
) ce
where p.role = 'va'::public.user_role
  and not (
    coalesce(au.raw_user_meta_data->>'role', '') = ''
    and (
      au.raw_user_meta_data->>'account_type' = 'training'
      or au.raw_app_meta_data->>'account_type' = 'training'
    )
  );

revoke all on public.recruiter_va_directory from public, anon, authenticated;
grant select on public.recruiter_va_directory to service_role;
