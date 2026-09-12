-- Enforce explicit, versioned VA consent before any professional profile can
-- appear in the public directory. Approval and directory_visible remain
-- separate operational decisions; consent is an additional publication gate.

insert into public.notifications (user_id, type, title, body, href)
select d.user_id,
       'public_profile_consent_required',
       'Choose whether your VA profile may appear publicly',
       'Your professional profile needs your explicit public-profile permission before it can appear in the talent directory. Review the privacy choice on your VA Profile page.',
       '/workspace/va/profile#visibility'
from public.public_va_directory d
join public.va_profiles v on v.user_id = d.user_id
where v.public_profile_consent = false
  and not exists (
    select 1 from public.notifications n
    where n.user_id = d.user_id
      and n.type = 'public_profile_consent_required'
  );

create or replace function private.public_va_directory_rows()
returns table (
  user_id uuid,
  slug text,
  full_name text,
  avatar_url text,
  email_verified boolean,
  identity_verified_at timestamptz,
  last_active_at timestamptz,
  headline text,
  bio text,
  primary_category text,
  categories text[],
  skills text[],
  tools text[],
  industries text[],
  languages text[],
  years_experience integer,
  weekly_hours integer,
  schedule text,
  preferred_timezone text,
  overlap_hours integer,
  portfolio_url text,
  linkedin_url text,
  availability_status text,
  hourly_rate numeric,
  has_portfolio boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    v.user_id,
    v.slug,
    case
      when p.full_name is null or btrim(p.full_name) = '' then 'Vetted VA'::text
      when position(' ' in btrim(p.full_name)) = 0 then btrim(p.full_name)
      else split_part(btrim(p.full_name), ' ', 1) || ' ' ||
        upper(left(reverse(split_part(reverse(btrim(p.full_name)), ' ', 1)), 1)) || '.'
    end as full_name,
    p.avatar_url,
    p.email_verified,
    p.identity_verified_at,
    p.last_active_at,
    v.headline,
    v.bio,
    v.primary_category,
    v.categories,
    v.skills,
    v.tools,
    v.industries,
    v.languages,
    v.years_experience,
    v.weekly_hours,
    v.schedule,
    v.preferred_timezone,
    v.overlap_hours,
    null::text as portfolio_url,
    null::text as linkedin_url,
    v.availability_status,
    v.hourly_rate,
    (v.portfolio_url is not null and btrim(v.portfolio_url) <> '') as has_portfolio,
    v.created_at
  from public.va_profiles v
  join public.profiles p on p.id = v.user_id
  join public.va_vetting vv on vv.va_id = v.user_id
  where v.directory_visible = true
    and v.public_profile_consent = true
    and vv.stage in ('approved','bench')
    and v.availability_status = 'available'
    and p.avatar_url is not null
    and btrim(p.avatar_url) <> ''
    and coalesce(v.years_experience, 0) >= 2
    and coalesce(v.hourly_rate, 0) >= 5
    and (
      case when p.avatar_url is not null and btrim(p.avatar_url) <> '' then 10 else 0 end +
      case when coalesce(length(btrim(v.headline)), 0) >= 8 then 10 else 0 end +
      case when coalesce(length(btrim(v.bio)), 0) >= 80 then 15 else 0 end +
      case when v.primary_category is not null and btrim(v.primary_category) <> '' then 5 else 0 end +
      case when cardinality(coalesce(v.skills, '{}'::text[])) >= 5 then 15 else 0 end +
      case when cardinality(coalesce(v.tools, '{}'::text[])) >= 3 then 5 else 0 end +
      case when coalesce(v.years_experience, 0) >= 1 then 10 else 0 end +
      case when coalesce(v.weekly_hours, 0) >= 1 then 10 else 0 end +
      case when coalesce(v.hourly_rate, 0) >= 5 then 10 else 0 end +
      case when v.resume_path is not null and btrim(v.resume_path) <> '' then 5 else 0 end +
      case when v.portfolio_url is not null and btrim(v.portfolio_url) <> '' then 5 else 0 end
    ) >= 80;
$$;

create or replace function public.va_dashboard_summary(p_va_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with va as (
    select jsonb_build_object(
      'user_id', v.user_id,
      'headline', v.headline,
      'bio', v.bio,
      'primary_category', v.primary_category,
      'categories', coalesce(v.categories, '{}'::text[]),
      'skills', coalesce(v.skills, '{}'::text[]),
      'tools', coalesce(v.tools, '{}'::text[]),
      'industries', coalesce(v.industries, '{}'::text[]),
      'languages', coalesce(v.languages, '{}'::text[]),
      'years_experience', v.years_experience,
      'weekly_hours', v.weekly_hours,
      'schedule', v.schedule,
      'overlap_hours', v.overlap_hours,
      'hourly_rate', v.hourly_rate,
      'portfolio_url', v.portfolio_url,
      'linkedin_url', v.linkedin_url,
      'resume_path', v.resume_path,
      'directory_visible', v.directory_visible,
      'public_profile_consent', v.public_profile_consent,
      'public_profile_consent_at', v.public_profile_consent_at,
      'public_profile_consent_version', v.public_profile_consent_version,
      'public_profile_consent_withdrawn_at', v.public_profile_consent_withdrawn_at,
      'availability_status', v.availability_status,
      'slug', v.slug,
      'preferred_timezone', v.preferred_timezone
    ) as profile
    from public.va_profiles v
    where v.user_id = p_va_id
  ),
  account as (
    select avatar_url from public.profiles where id = p_va_id
  ),
  vetting as (
    select jsonb_build_object('stage', stage, 'video_url', video_url) as data
    from public.va_vetting
    where va_id = p_va_id
  ),
  latest_test as (
    select coalesce(final_score, auto_score) as score
    from public.va_test_attempts
    where va_id = p_va_id
    order by submitted_at desc
    limit 1
  ),
  latest_scorecard as (
    select total_score
    from public.vetting_scorecards
    where va_id = p_va_id
    order by created_at desc
    limit 1
  ),
  app_metrics as (
    select
      count(*)::int as application_count,
      count(*) filter (where status in ('new', 'reviewing'))::int as applied,
      count(*) filter (where status = 'shortlisted')::int as shortlisted,
      count(*) filter (where status = 'interview')::int as interview,
      count(*) filter (where status = 'offered')::int as offered,
      count(*) filter (where status = 'hired')::int as hired,
      count(*) filter (where status = 'rejected')::int as rejected
    from public.applications
    where va_id = p_va_id
  ),
  recruiter_requests as (
    select coalesce(jsonb_agg(to_jsonb(x) order by x.created_at desc), '[]'::jsonb) as rows
    from (
      select id, title, body, href, created_at
      from public.notifications
      where user_id = p_va_id
        and read_at is null
        and type in ('profile_update_request','public_profile_consent_required')
      order by created_at desc
      limit 3
    ) x
  )
  select jsonb_build_object(
    'profile', coalesce((select profile from va), '{}'::jsonb),
    'avatar_url', (select avatar_url from account),
    'vetting', coalesce((select data from vetting), '{}'::jsonb),
    'test_score', (select score from latest_test),
    'scorecard_total', (select total_score from latest_scorecard),
    'application_count', a.application_count,
    'pipeline', jsonb_build_object(
      'applied', a.applied,
      'shortlisted', a.shortlisted,
      'interview', a.interview,
      'offered', a.offered,
      'hired', a.hired,
      'rejected', a.rejected
    ),
    'pending_invites', (select count(*)::int from public.job_invites where va_id = p_va_id and status = 'pending'),
    'workroom_count', (select count(*)::int from public.workrooms where va_id = p_va_id),
    'certification_count', (select count(*)::int from public.public_va_certifications where va_id = p_va_id),
    'unread_notifications', (select count(*)::int from public.notifications where user_id = p_va_id and read_at is null),
    'recruiter_requests', r.rows,
    'unread_messages', (
      select count(*)::int
      from public.messages m
      join public.conversations c on c.id = m.conversation_id
      where c.va_id = p_va_id
        and m.sender_id <> p_va_id
        and m.read_at is null
    )
  )
  from app_metrics a
  cross join recruiter_requests r;
$$;
