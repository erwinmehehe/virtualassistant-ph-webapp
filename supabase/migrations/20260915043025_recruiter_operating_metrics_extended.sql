-- Recruiting operations metrics that measure speed, conversion and placement quality.

create or replace function public.recruiter_operating_metrics()
returns jsonb
language sql
security definer
set search_path = public
as $$
  with first_shortlist as (
    select j.id job_id,j.created_at,min(s.released_at) first_released
    from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.released_at is not null
    group by j.id,j.created_at
  ), released_jobs as (
    select distinct job_id from job_shortlist_candidates where shortlist_status='released'
  ), interview_jobs as (
    select distinct job_id from candidate_interviews where status in ('scheduled','completed')
    union select distinct job_id from applications where status in ('interview','offered','hired')
  ), hired_jobs as (select distinct job_id from applications where status='hired'),
  client_response as (
    select job_id,min(released_at) released_at,min(client_decision_at) decision_at
    from job_shortlist_candidates where shortlist_status='released' group by job_id
  ), pass_reasons as (
    select split_part(coalesce(nullif(client_decision_note,''),'No reason supplied'),':',1) reason,count(*) n
    from job_shortlist_candidates where client_decision='pass' and client_decision_at>=now()-interval '30 days'
    group by 1 order by n desc limit 8
  ), recruiter_placements as (
    select coalesce(p.full_name,'Unassigned recruiter') recruiter,count(*) n
    from placement_offers po left join profiles p on p.id=po.created_by
    where po.status='accepted' and po.client_confirmed_at>=now()-interval '30 days'
    group by 1 order by n desc
  )
  select jsonb_build_object(
    'avg_time_to_shortlist_hours', coalesce((select round(avg(extract(epoch from (first_released-created_at))/3600)::numeric,1) from first_shortlist),0),
    'shortlist_to_interview_rate', coalesce((select round(100.0*count(*) filter(where r.job_id in(select job_id from interview_jobs))/nullif(count(*),0),1) from released_jobs r),0),
    'interview_to_hire_rate', coalesce((select round(100.0*count(*) filter(where i.job_id in(select job_id from hired_jobs))/nullif(count(*),0),1) from interview_jobs i),0),
    'avg_client_response_hours', coalesce((select round(avg(extract(epoch from (decision_at-released_at))/3600)::numeric,1) from client_response where decision_at is not null),0),
    'avg_va_offer_response_hours', coalesce((select round(avg(extract(epoch from (coalesce(va_accepted_at,declined_at)-created_at))/3600)::numeric,1) from placement_offers where coalesce(va_accepted_at,declined_at) is not null),0),
    'roles_stuck_3d', (select count(*) from jobs j where j.status in ('pending','published') and j.created_at <= now()-interval '3 days' and not exists(select 1 from applications a where a.job_id=j.id and a.status='hired')),
    'placements_30d', (select count(*) from applications where status='hired' and updated_at >= now()-interval '30 days'),
    'offers_waiting', (select count(*) from placement_offers where status in ('pending_va','pending_client')),
    'interviews_next_7d', (select count(*) from candidate_interviews where status='scheduled' and scheduled_at between now() and now()+interval '7 days'),
    'pass_reasons_30d', coalesce((select jsonb_agg(jsonb_build_object('reason',reason,'count',n)) from pass_reasons),'[]'::jsonb),
    'placements_by_recruiter_30d', coalesce((select jsonb_agg(jsonb_build_object('recruiter',recruiter,'count',n)) from recruiter_placements),'[]'::jsonb)
  );
$$;

revoke execute on function public.recruiter_operating_metrics() from public,anon,authenticated;
grant execute on function public.recruiter_operating_metrics() to service_role;
