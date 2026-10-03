-- Published job posts always name the hiring company.
-- Richer company-profile fields (logo, website, industry, location, team size,
-- description, verification and hire count) remain opt-in via
-- client_profiles.public_company_visible.

create or replace function private.public_job_rows()
returns table(
  id uuid,
  slug text,
  title text,
  company_name text,
  summary text,
  description text,
  responsibilities text[],
  required_skills text[],
  required_tools text[],
  categories text[],
  hours_per_week integer,
  min_hourly_rate numeric,
  max_hourly_rate numeric,
  timezone text,
  overlap_hours integer,
  schedule_notes text,
  direct_feedback boolean,
  engagement_length text,
  start_timing text,
  experience_level text,
  published_at timestamptz,
  expires_at timestamptz,
  company_logo_url text,
  company_website text,
  company_industry text,
  company_location text,
  company_team_size text,
  company_description text,
  company_verified_at timestamptz,
  company_hires_count integer
)
language sql
stable
security definer
set search_path='pg_catalog'
as $$
  select
    j.id,
    j.slug,
    j.title,
    j.company_name,
    j.summary,
    j.description,
    j.responsibilities,
    j.required_skills,
    j.required_tools,
    j.categories,
    j.hours_per_week,
    j.min_hourly_rate,
    j.max_hourly_rate,
    j.timezone,
    j.overlap_hours,
    j.schedule_notes,
    j.direct_feedback,
    j.engagement_length,
    j.start_timing,
    j.experience_level,
    j.published_at,
    j.expires_at,
    c.logo_url,
    c.website,
    c.industry,
    c.location,
    c.team_size,
    c.company_description,
    c.verified_at,
    case
      when c.user_id is null then 0
      else (
        select count(*)::integer
        from public.workrooms w
        where w.client_id = c.user_id
      )
    end as company_hires_count
  from public.jobs j
  left join public.client_profiles c
    on c.user_id = j.client_id
   and c.public_company_visible = true
  where j.status = 'published'
    and j.moderation_status = 'clear'
    and j.client_id is not null
    and j.company_name is not null
    and btrim(j.company_name) <> ''
    and lower(btrim(j.company_name)) not in (
      'n/a',
      'na',
      'none',
      'test',
      'private employer',
      'confidential client'
    )
    and j.expires_at is not null
    and j.expires_at > now();
$$;
