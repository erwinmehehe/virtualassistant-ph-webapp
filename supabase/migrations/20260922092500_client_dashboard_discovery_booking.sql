create or replace function public.client_dashboard_summary(p_client_id uuid)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with client_jobs as materialized (
    select id,title,status,created_at,published_at,recruiter_id
    from jobs where client_id=p_client_id
  ),
  company as (
    select jsonb_build_object('company_name',company_name,'timezone',timezone,'onboarding_completed_at',onboarding_completed_at) data
    from client_profiles where user_id=p_client_id
  ),
  hiring_owner as (
    select jsonb_build_object('id',p.id,'full_name',p.full_name) data
    from client_jobs j join profiles p on p.id=j.recruiter_id
    where j.status in ('pending','published')
    order by j.created_at desc limit 1
  ),
  discovery_booking as (
    select jsonb_build_object(
      'id',l.id,
      'created_at',l.created_at,
      'discovery_scheduled_at',l.discovery_scheduled_at,
      'discovery_outcome',l.discovery_outcome,
      'discovery_cancelled_at',l.discovery_cancelled_at,
      'discovery_meeting_url',l.discovery_meeting_url
    ) data
    from lead_intake l
    where l.client_id=p_client_id
      and l.lead_type='client_hiring'
      and (
        l.discovery_scheduled_at is not null
        or l.discovery_outcome in ('no_show','cancelled','rescheduled')
      )
    order by l.created_at desc
    limit 1
  ),
  shortlist as (
    select s.* from job_shortlist_candidates s join client_jobs j on j.id=s.job_id where s.shortlist_status='released'
  ),
  interviews as (
    select ci.* from candidate_interviews ci join client_jobs j on j.id=ci.job_id where ci.status<>'cancelled'
  ),
  offers as (
    select po.* from placement_offers po join client_jobs j on j.id=po.job_id
  ),
  work as (
    select w.* from workrooms w join client_jobs j on j.id=w.job_id
  ),
  app_metrics as (
    select
      (select count(*)::int from shortlist) application_count,
      0::int applied,
      (select count(*)::int from shortlist where client_decision is null or client_decision='interested') shortlisted,
      (select count(*)::int from interviews where status in ('requested','scheduled','completed') and client_decision is null) interview,
      (select count(*)::int from offers where status in ('pending_va','pending_client')) offered,
      (select count(*)::int from work where status='active') hired,
      (select count(*)::int from shortlist where client_decision='pass') rejected
  ),
  recent_jobs as (
    select j.id,j.title,j.status,j.created_at,j.published_at,
      0::int applicants,
      (select count(*)::int from shortlist s where s.job_id=j.id and (s.client_decision is null or s.client_decision='interested')) shortlisted,
      (select count(*)::int from interviews i where i.job_id=j.id and i.status in ('requested','scheduled','completed') and i.client_decision is null) interview,
      (select count(*)::int from offers o where o.job_id=j.id and o.status in ('pending_va','pending_client')) offered,
      (select count(*)::int from work w where w.job_id=j.id and w.status='active') hired
    from client_jobs j order by j.created_at desc limit 6
  ),
  unread as (
    select count(*)::int messages from messages m join conversations c on c.id=m.conversation_id
    where c.client_id=p_client_id and m.sender_id<>p_client_id and m.read_at is null
  )
  select jsonb_build_object(
    'company',coalesce((select data from company),'{}'::jsonb),
    'hiring_owner',coalesce((select data from hiring_owner),'{}'::jsonb),
    'discovery_booking',(select data from discovery_booking),
    'job_count',(select count(*)::int from client_jobs),
    'active_jobs',(select count(*)::int from client_jobs where status='published'),
    'hire_count',(select count(*)::int from work),
    'application_count',a.application_count,
    'unread_messages',u.messages,
    'pipeline',jsonb_build_object('applied',a.applied,'shortlisted',a.shortlisted,'interview',a.interview,'offered',a.offered,'hired',a.hired,'rejected',a.rejected),
    'jobs',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from recent_jobs r),'[]'::jsonb)
  ) from app_metrics a cross join unread u;
$function$;
