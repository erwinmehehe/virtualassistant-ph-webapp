-- Collapse the client Hiring Room fan-out into one server-only summary read.
create or replace function public.client_hiring_room_summary(
  p_client_id uuid,
  p_selected_job_id uuid default null
)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with client_jobs as materialized (
  select id,title,status,created_at
  from jobs
  where client_id=p_client_id
),
selected_id as (
  select coalesce(
    (select id from client_jobs where status<>'closed' and id=p_selected_job_id limit 1),
    (select id from client_jobs where status<>'closed' order by created_at desc limit 1)
  ) id
),
selected_job as (
  select j.* from client_jobs j join selected_id s on s.id=j.id
),
selected_released as materialized (
  select
    s.id,s.job_id,s.va_id,s.match_score,s.shortlist_order,s.released_at,
    s.client_recommendation,s.client_decision,s.client_decision_note,s.client_decision_at
  from job_shortlist_candidates s
  join selected_id sj on sj.id=s.job_id
  where s.shortlist_status='released'
),
selected_access as (
  select a.access_status
  from job_candidate_access a
  join selected_id s on s.id=a.job_id
  limit 1
),
visible_candidates as materialized (
  select distinct r.va_id
  from selected_released r
  cross join selected_job j
  left join selected_access a on true
  where j.status='published'
    and a.access_status in ('paid','comped')
),
profile_rows as (
  select p.id,p.full_name
  from profiles p
  join visible_candidates v on v.va_id=p.id
),
va_rows as (
  select
    v.user_id,v.slug,v.headline,v.primary_category,v.weekly_hours,v.hourly_rate,
    v.skills,v.tools,v.years_experience,v.schedule,v.overlap_hours
  from va_profiles v
  join visible_candidates c on c.va_id=v.user_id
),
credential_rows as (
  select
    tc.user_id,
    tc.id,
    tc.credential_code,
    tc.issued_at,
    c.id as course_id,
    c.slug as course_slug,
    c.title as course_title,
    c.summary as course_summary,
    c.category,
    c.estimated_minutes
  from training_certificates tc
  join training_courses c on c.id=tc.course_id and c.status='published'
  join visible_candidates v on v.va_id=tc.user_id
  where tc.revoked_at is null
),
active_counts as (
  select
    (
      select count(*)::int
      from candidate_interviews i
      join client_jobs j on j.id=i.job_id
      where i.status in ('requested','scheduled')
        and i.client_decision is null
    ) as active_interviews,
    (
      select count(*)::int
      from placement_offers o
      join client_jobs j on j.id=o.job_id
      where o.status in ('pending_va','pending_client')
    ) as active_offers
)
select jsonb_build_object(
  'jobs', coalesce((
    select jsonb_agg(to_jsonb(j) order by j.created_at desc)
    from client_jobs j
  ), '[]'::jsonb),
  'selected_job', (
    select to_jsonb(j) from selected_job j
  ),
  'access_status', (
    select access_status from selected_access
  ),
  'released', coalesce((
    select jsonb_agg(
      to_jsonb(r)
      order by r.shortlist_order asc nulls last, r.released_at desc nulls last
    )
    from selected_released r
  ), '[]'::jsonb),
  'profiles', coalesce((
    select jsonb_agg(to_jsonb(p) order by p.full_name asc nulls last)
    from profile_rows p
  ), '[]'::jsonb),
  'vas', coalesce((
    select jsonb_agg(to_jsonb(v))
    from va_rows v
  ), '[]'::jsonb),
  'credentials', coalesce((
    select jsonb_agg(jsonb_build_object(
      'user_id',cr.user_id,
      'id',cr.id,
      'credential_code',cr.credential_code,
      'issued_at',cr.issued_at,
      'course_id',cr.course_id,
      'course_slug',cr.course_slug,
      'course_title',cr.course_title,
      'course_summary',cr.course_summary,
      'category',cr.category,
      'estimated_minutes',cr.estimated_minutes
    ) order by cr.issued_at desc)
    from credential_rows cr
  ), '[]'::jsonb),
  'active_interviews', a.active_interviews,
  'active_offers', a.active_offers
)
from active_counts a;
$function$;

create or replace function public.record_client_shortlist_view(
  p_client_id uuid,
  p_job_id uuid,
  p_released_count integer
)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if coalesce(p_released_count,0) <= 0 then
    return false;
  end if;

  if not exists (
    select 1 from jobs
    where id=p_job_id
      and client_id=p_client_id
      and status='published'
  ) then
    return false;
  end if;

  if exists (
    select 1
    from recruiter_activity
    where subject_type='job'
      and subject_id=p_job_id
      and action='client_shortlist_viewed'
      and actor_id=p_client_id
      and created_at>=now()-interval '6 hours'
  ) then
    return false;
  end if;

  insert into recruiter_activity(
    subject_type,subject_id,action,description,actor_id,metadata
  ) values (
    'job',
    p_job_id,
    'client_shortlist_viewed',
    'Client viewed the recruiter-curated shortlist',
    p_client_id,
    jsonb_build_object('released_count',p_released_count)
  );

  return true;
end;
$function$;

revoke execute on function public.client_hiring_room_summary(uuid,uuid) from public, anon, authenticated;
grant execute on function public.client_hiring_room_summary(uuid,uuid) to service_role;

revoke execute on function public.record_client_shortlist_view(uuid,uuid,integer) from public, anon, authenticated;
grant execute on function public.record_client_shortlist_view(uuid,uuid,integer) to service_role;
