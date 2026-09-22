create or replace function private.public_va_directory_rows()
returns table(
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
set search_path = 'pg_catalog'
as $function$
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
    and v.public_profile_consent_at is not null
    and v.public_profile_consent_withdrawn_at is null
    and v.public_profile_consent_version = '2026-09-12-v1'
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
$function$;
