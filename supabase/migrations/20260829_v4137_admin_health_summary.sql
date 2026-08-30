-- v4.13.7: compute the admin health integrity checks in the database.
--
-- The health screen derived four numbers by pulling rows to the app and
-- comparing them in JavaScript: every va_profiles row, every va_vetting row,
-- every active job, 5000 job ids, 5000 VA ids, 5000 applications, and every
-- proposed/released shortlist row. All of it was discarded after counting.
--
-- These are anti-joins, which the database does far better than a Set in Node.
-- Service-role only, matching how the admin screens already read.

create or replace function public.admin_health_summary()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    -- VA profiles with no usable public slug.
    'missing_slugs', (
      select count(*) from public.va_profiles v
      where v.slug is null or btrim(v.slug) = ''
    ),
    -- VA profiles with no vetting record at all.
    'missing_vetting', (
      select count(*) from public.va_profiles v
      where not exists (select 1 from public.va_vetting vv where vv.va_id = v.user_id)
    ),
    -- Applications pointing at a job or a VA that no longer exists.
    'orphaned_applications', (
      select count(*) from public.applications a
      where not exists (select 1 from public.jobs j where j.id = a.job_id)
         or not exists (select 1 from public.profiles p where p.id = a.va_id)
    ),
    -- Active roles with neither an application nor an assigned shortlist.
    'roles_without_candidates', (
      select count(*) from public.jobs j
      where j.status in ('pending', 'published')
        and not exists (select 1 from public.applications a where a.job_id = j.id)
        and not exists (
          select 1 from public.job_shortlist_candidates s
          where s.job_id = j.id and s.shortlist_status in ('proposed', 'released')
        )
    )
  );
$$;

revoke all on function public.admin_health_summary() from anon, authenticated;

select public.admin_health_summary() as health_summary;
