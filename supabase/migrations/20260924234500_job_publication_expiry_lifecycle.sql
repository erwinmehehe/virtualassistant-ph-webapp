-- Give every public job an explicit search-engine and marketplace lifetime.
-- Public visibility is enforced at the database contract so stale roles disappear
-- from listings, detail lookups, applications, and the sitemap at the same time.

alter table public.jobs
  add column if not exists expires_at timestamptz;

update public.jobs
set expires_at = coalesce(published_at, created_at) + interval '30 days'
where status = 'published'
  and expires_at is null;

create index if not exists jobs_public_expiry_idx
  on public.jobs (expires_at, published_at desc)
  where status = 'published' and moderation_status = 'clear';

create or replace function public.set_job_publication_window()
returns trigger
language plpgsql
set search_path = 'pg_catalog'
as $$
begin
  if new.status = 'published' then
    if tg_op = 'INSERT' then
      new.published_at := coalesce(new.published_at, now());
    elsif old.status is distinct from 'published' then
      if new.published_at is null or new.published_at = old.published_at then
        new.published_at := now();
      end if;
    end if;

    if new.expires_at is null
       or (tg_op = 'UPDATE' and old.status is distinct from 'published') then
      new.expires_at := new.published_at + interval '30 days';
    end if;
  elsif new.status = 'closed' and new.closed_at is null then
    new.closed_at := now();
  end if;

  return new;
end;
$$;

revoke all on function public.set_job_publication_window() from public, anon, authenticated;

drop trigger if exists jobs_set_publication_window on public.jobs;
create trigger jobs_set_publication_window
before insert or update of status, published_at, expires_at
on public.jobs
for each row
execute function public.set_job_publication_window();

drop view if exists public.public_jobs;
drop function if exists private.public_job_rows();

create function private.public_job_rows()
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
set search_path = 'pg_catalog'
as $$
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
    and j.client_id is not null
    and j.expires_at is not null
    and j.expires_at > now();
$$;

revoke all on function private.public_job_rows() from public;
grant execute on function private.public_job_rows() to anon, authenticated, service_role;

create view public.public_jobs
with (security_invoker = true, security_barrier = true)
as
select * from private.public_job_rows();

revoke all on table public.public_jobs from public, anon, authenticated, service_role;
grant select on table public.public_jobs to anon, authenticated, service_role;

comment on column public.jobs.expires_at is
  'Public job expiry. Publication defaults to 30 days; expired roles are removed from the public_jobs contract.';
