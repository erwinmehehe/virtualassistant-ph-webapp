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
set search_path = 'pg_catalog'
as $function$
  select
    j.id,
    j.slug,
    j.title,
    c.company_name,
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
    c.logo_url,
    c.website,
    c.industry,
    c.location,
    c.team_size,
    c.company_description,
    c.verified_at,
    case
      when c.user_id is null then 0
      else (select count(*)::integer from public.workrooms w where w.client_id = c.user_id)
    end as company_hires_count
  from public.jobs j
  left join public.client_profiles c
    on c.user_id = j.client_id
   and c.public_company_visible = true
   and c.company_name is not null
   and btrim(c.company_name) <> ''
  where j.status = 'published'
    and j.moderation_status = 'clear'
    and j.client_id is not null;
$function$;

revoke all on function private.public_job_rows() from public, anon, authenticated;
grant execute on function private.public_job_rows() to anon, authenticated, service_role;

create or replace view public.public_jobs
with (security_invoker = true, security_barrier = true)
as
select * from private.public_job_rows();

revoke all on public.public_jobs from public, anon, authenticated;
grant select on public.public_jobs to anon, authenticated, service_role;

create or replace function public.consume_action_rate_limit(
  p_action_key text,
  p_subject_hash text,
  p_max_attempts integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = 'pg_catalog'
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_attempts integer;
begin
  if coalesce(length(btrim(p_action_key)), 0) = 0
     or coalesce(length(btrim(p_subject_hash)), 0) = 0
     or p_max_attempts < 1
     or p_window_seconds < 1 then
    return false;
  end if;

  insert into public.action_rate_limits(
    action_key,
    subject_hash,
    attempts,
    window_started_at,
    updated_at
  )
  values(
    p_action_key,
    p_subject_hash,
    1,
    v_now,
    v_now
  )
  on conflict (action_key, subject_hash)
  do update set
    attempts = case
      when public.action_rate_limits.window_started_at <= v_now - (p_window_seconds * interval '1 second')
        then 1
      else public.action_rate_limits.attempts + 1
    end,
    window_started_at = case
      when public.action_rate_limits.window_started_at <= v_now - (p_window_seconds * interval '1 second')
        then v_now
      else public.action_rate_limits.window_started_at
    end,
    updated_at = v_now
  returning attempts into v_attempts;

  return v_attempts <= p_max_attempts;
end;
$function$;

revoke all on function public.consume_action_rate_limit(text, text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.consume_action_rate_limit(text, text, integer, integer)
  to service_role;
