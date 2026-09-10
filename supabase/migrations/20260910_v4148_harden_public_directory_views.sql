-- v4.14.8 harden public directory views
-- Keep the existing sanitized public contract, but move privileged source reads
-- into private, read-only functions. Public views become security invoker.

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

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
  hourly_rate numeric(8,2),
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

create or replace function private.public_company_profile_rows()
returns table (
  user_id uuid,
  company_name text,
  logo_url text,
  website text,
  industry text,
  location text,
  team_size text,
  company_description text,
  verified_at timestamptz,
  hires_count integer
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    c.user_id,
    c.company_name,
    c.logo_url,
    c.website,
    c.industry,
    c.location,
    c.team_size,
    c.company_description,
    c.verified_at,
    (select count(*)::integer from public.workrooms w where w.client_id = c.user_id) as hires_count
  from public.client_profiles c
  where c.company_name is not null
    and btrim(c.company_name) <> '';
$$;

create or replace function private.public_va_review_rows()
returns table (
  id uuid,
  reviewee_id uuid,
  rating integer,
  body text,
  created_at timestamptz,
  reviewer_label text
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    r.id,
    r.reviewee_id,
    r.rating,
    r.body,
    r.created_at,
    'Verified client'::text as reviewer_label
  from public.reviews r
  join public.workrooms w on w.id = r.workroom_id
  where r.visibility = 'public'
    and r.reviewer_id = w.client_id
    and r.reviewee_id = w.va_id
    and exists (
      select 1
      from private.public_va_directory_rows() d
      where d.user_id = r.reviewee_id
    );
$$;

create or replace function private.public_va_certification_rows()
returns table (
  va_id uuid,
  category text,
  test_title text,
  final_score integer,
  passing_score integer,
  reviewed_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select
    vta.va_id,
    st.category,
    st.title as test_title,
    vta.final_score,
    st.passing_score,
    vta.reviewed_at
  from public.va_test_attempts vta
  join public.skills_tests st on st.id = vta.test_id
  where st.active = true
    and vta.final_score is not null
    and vta.final_score >= st.passing_score;
$$;

revoke all on function private.public_va_directory_rows() from public;
revoke all on function private.public_company_profile_rows() from public;
revoke all on function private.public_va_review_rows() from public;
revoke all on function private.public_va_certification_rows() from public;

grant execute on function private.public_va_directory_rows() to anon, authenticated, service_role;
grant execute on function private.public_company_profile_rows() to anon, authenticated, service_role;
grant execute on function private.public_va_review_rows() to anon, authenticated, service_role;
grant execute on function private.public_va_certification_rows() to anon, authenticated, service_role;

create or replace view public.public_va_directory
with (security_invoker = true, security_barrier = true)
as
select
  user_id,
  slug,
  full_name,
  avatar_url,
  email_verified,
  identity_verified_at,
  last_active_at,
  headline,
  bio,
  primary_category,
  categories,
  skills,
  tools,
  industries,
  languages,
  years_experience,
  weekly_hours,
  schedule,
  preferred_timezone,
  overlap_hours,
  portfolio_url,
  linkedin_url,
  availability_status,
  hourly_rate::numeric(8,2) as hourly_rate,
  has_portfolio,
  created_at
from private.public_va_directory_rows();

create or replace view public.public_company_profiles
with (security_invoker = true, security_barrier = true)
as
select * from private.public_company_profile_rows();

create or replace view public.public_va_reviews
with (security_invoker = true, security_barrier = true)
as
select * from private.public_va_review_rows();

create or replace view public.public_va_certifications
with (security_invoker = true, security_barrier = true)
as
select * from private.public_va_certification_rows();

revoke all on table public.public_va_directory from anon, authenticated;
revoke all on table public.public_company_profiles from anon, authenticated;
revoke all on table public.public_va_reviews from anon, authenticated;
revoke all on table public.public_va_certifications from anon, authenticated;

grant select on table public.public_va_directory to anon, authenticated;
grant select on table public.public_company_profiles to anon, authenticated;
grant select on table public.public_va_reviews to anon, authenticated;
grant select on table public.public_va_certifications to anon, authenticated;
