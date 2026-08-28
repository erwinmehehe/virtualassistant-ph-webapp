-- v4.10: public profile privacy/eligibility and readable public job URLs.

alter table public.jobs add column if not exists slug text;

-- Backfill existing jobs with readable, stable slugs. Add -2, -3 only when titles collide.
with ranked as (
  select
    id,
    'j-' || trim(both '-' from regexp_replace(lower(coalesce(nullif(title, ''), 'virtual-assistant-role')), '[^a-z0-9]+', '-', 'g')) as base_slug,
    row_number() over (
      partition by trim(both '-' from regexp_replace(lower(coalesce(nullif(title, ''), 'virtual-assistant-role')), '[^a-z0-9]+', '-', 'g'))
      order by created_at, id
    ) as duplicate_number
  from public.jobs
  where slug is null or btrim(slug) = ''
)
update public.jobs j
set slug = ranked.base_slug || case when ranked.duplicate_number = 1 then '' else '-' || ranked.duplicate_number::text end
from ranked
where j.id = ranked.id;

create unique index if not exists jobs_slug_unique_idx on public.jobs(slug) where slug is not null;
create index if not exists jobs_public_lookup_idx on public.jobs(status, slug, published_at desc);

-- Public-safe directory: approved/bench, available, opted in, and 2+ years of experience.
-- The full legal name is intentionally not exposed through this anon-readable view.
create or replace view public.public_va_directory as
select
  v.user_id,
  v.slug,
  case
    when p.full_name is null or btrim(p.full_name) = '' then 'Vetted VA'
    when position(' ' in btrim(p.full_name)) = 0 then btrim(p.full_name)
    else split_part(btrim(p.full_name), ' ', 1) || ' ' || upper(left(reverse(split_part(reverse(btrim(p.full_name)), ' ', 1)), 1)) || '.'
  end as full_name,
  p.avatar_url,
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
  v.overlap_hours,
  null::text as portfolio_url,
  null::text as linkedin_url,
  v.availability_status,
  v.hourly_rate
from public.va_profiles v
join public.profiles p on p.id = v.user_id
join public.va_vetting vv on vv.va_id = v.user_id
where v.directory_visible = true
  and v.availability_status = 'available'
  and coalesce(v.years_experience, 0) >= 2
  and vv.stage in ('approved','bench');

revoke all on public.public_va_directory from anon;
grant select on public.public_va_directory to anon, authenticated;

-- Any code path that creates a job (client wizard, admin, lead conversion) gets a readable slug.
-- The slug is intentionally stable after creation so shared public URLs do not change when a title is edited.
create or replace function public.ensure_job_slug()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  base_slug text;
  candidate text;
  suffix integer := 2;
begin
  if new.slug is not null and btrim(new.slug) <> '' then
    return new;
  end if;

  base_slug := 'j-' || trim(both '-' from regexp_replace(lower(coalesce(nullif(new.title, ''), 'virtual-assistant-role')), '[^a-z0-9]+', '-', 'g'));
  if base_slug = 'j-' then
    base_slug := 'j-virtual-assistant-role';
  end if;
  candidate := base_slug;

  while exists(select 1 from public.jobs where slug = candidate and id <> new.id) loop
    candidate := base_slug || '-' || suffix::text;
    suffix := suffix + 1;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

drop trigger if exists jobs_ensure_slug on public.jobs;
create trigger jobs_ensure_slug
before insert on public.jobs
for each row execute procedure public.ensure_job_slug();
