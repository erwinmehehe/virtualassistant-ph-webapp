-- Recruiter operating system: hard requirements, screening, interviews,
-- placements, daily actions and operating metrics.

alter table public.jobs add column if not exists must_have_skills text[] not null default '{}';
alter table public.jobs add column if not exists nice_to_have_skills text[] not null default '{}';
alter table public.jobs add column if not exists must_have_tools text[] not null default '{}';
alter table public.jobs add column if not exists required_industries text[] not null default '{}';
alter table public.jobs add column if not exists minimum_years_experience integer;
alter table public.jobs add column if not exists communication_requirement text;
alter table public.jobs add column if not exists dealbreakers text[] not null default '{}';
alter table public.jobs add column if not exists recruiter_id uuid references public.profiles(id) on delete set null;
alter table public.jobs drop constraint if exists jobs_minimum_years_experience_check;
alter table public.jobs add constraint jobs_minimum_years_experience_check check (minimum_years_experience is null or minimum_years_experience between 0 and 60);

alter table public.vetting_scorecards add column if not exists english smallint;
alter table public.vetting_scorecards add column if not exists professionalism smallint;
alter table public.vetting_scorecards add column if not exists tool_fluency smallint;
alter table public.vetting_scorecards add column if not exists problem_solving smallint;
alter table public.vetting_scorecards add column if not exists schedule_reliability smallint;
alter table public.vetting_scorecards add column if not exists work_setup smallint;
alter table public.vetting_scorecards add column if not exists screening_result text;
alter table public.vetting_scorecards drop constraint if exists vetting_scorecards_extended_ratings_check;
alter table public.vetting_scorecards add constraint vetting_scorecards_extended_ratings_check check (
  (english is null or english between 1 and 5) and (professionalism is null or professionalism between 1 and 5) and
  (tool_fluency is null or tool_fluency between 1 and 5) and (problem_solving is null or problem_solving between 1 and 5) and
  (schedule_reliability is null or schedule_reliability between 1 and 5) and (work_setup is null or work_setup between 1 and 5)
);
alter table public.vetting_scorecards drop constraint if exists vetting_scorecards_screening_result_check;
alter table public.vetting_scorecards add constraint vetting_scorecards_screening_result_check check (screening_result is null or screening_result in ('client_ready','needs_development','role_specific','do_not_present'));

create table if not exists public.candidate_interviews (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade, client_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null, shortlist_candidate_id uuid references public.job_shortlist_candidates(id) on delete set null,
  status text not null default 'requested' check (status in ('requested','scheduled','completed','cancelled')),
  suggested_slots jsonb not null default '[]'::jsonb, scheduled_at timestamptz, timezone text,
  duration_minutes integer not null default 30 check (duration_minutes between 15 and 120),
  zoom_meeting_id text, meeting_url text, manage_token_hash text,
  client_decision text check (client_decision is null or client_decision in ('proceed','hold','pass')),
  client_feedback text, client_feedback_reason text, client_feedback_at timestamptz, completed_at timestamptz,
  cancelled_at timestamptz, rescheduled_at timestamptz, reminder_24h_sent_at timestamptz, reminder_1h_sent_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists candidate_interviews_active_job_va_idx on public.candidate_interviews(job_id,va_id) where status <> 'cancelled';
create index if not exists candidate_interviews_schedule_idx on public.candidate_interviews(status,scheduled_at);

create table if not exists public.placement_offers (
  id uuid primary key default gen_random_uuid(), job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade, client_id uuid not null references public.profiles(id) on delete cascade,
  application_id uuid references public.applications(id) on delete set null, created_by uuid references public.profiles(id) on delete set null,
  status text not null default 'pending_va' check (status in ('pending_va','pending_client','accepted','declined','cancelled')),
  hourly_rate numeric not null check (hourly_rate > 0), weekly_hours integer not null check (weekly_hours between 1 and 80),
  timezone text, schedule text not null, start_date date not null, service_type text not null default 'curated_placement', notes text,
  va_accepted_at timestamptz, client_confirmed_at timestamptz, declined_at timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists placement_offers_active_job_va_idx on public.placement_offers(job_id,va_id) where status in ('pending_va','pending_client','accepted');
create index if not exists placement_offers_status_idx on public.placement_offers(status,created_at);

alter table public.candidate_interviews enable row level security;
alter table public.placement_offers enable row level security;
revoke all on table public.candidate_interviews from anon, authenticated;
revoke all on table public.placement_offers from anon, authenticated;
grant select,insert,update,delete on table public.candidate_interviews to service_role;
grant select,insert,update,delete on table public.placement_offers to service_role;

create or replace function public.recruiter_daily_action_queue()
returns table(priority text,action_type text,title text,description text,href text,subject_type text,subject_id uuid,age_hours integer)
language sql security definer set search_path=public as $$
with released as (
  select j.id job_id,j.title,min(s.released_at) released_at,
    count(*) filter(where s.client_decision is null) waiting,count(*) filter(where s.client_decision='pass') passed,count(*) total,
    exists(select 1 from recruiter_activity ra where ra.subject_type='job' and ra.subject_id=j.id and ra.action='client_shortlist_viewed') viewed
  from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.shortlist_status='released'
  where j.status<>'closed' group by j.id,j.title
), roles_without as (
  select j.id,j.title,j.created_at from jobs j where j.status in ('pending','published') and j.created_at<=now()-interval '24 hours'
  and not exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.shortlist_status in ('proposed','released'))
  and not exists(select 1 from applications a where a.job_id=j.id and a.status not in ('rejected','withdrawn'))
), conflicts as (
  select a.va_id,count(distinct a.job_id) roles from applications a join jobs j on j.id=a.job_id and j.status<>'closed'
  where a.status in ('interview','offered','hired') group by a.va_id having count(distinct a.job_id)>=2
), actions as (
  select case when extract(epoch from(now()-r.released_at))/3600>=72 then 'urgent' else 'high' end::text priority,
    'client_shortlist_waiting'::text action_type,case when r.viewed then 'Client viewed shortlist but has not decided' else 'Client has not reviewed shortlist' end::text title,
    (r.title||' · '||r.waiting||' candidate(s) waiting for feedback')::text description,'/workspace/recruiter/client-review'::text href,'job'::text subject_type,r.job_id subject_id,
    floor(extract(epoch from(now()-r.released_at))/3600)::int age_hours from released r where r.waiting>0 and r.released_at<=now()-interval '24 hours'
  union all select 'urgent','all_candidates_passed','All released candidates were passed',(r.title||' needs replacement matches')::text,('/workspace/recruiter/matching/'||r.job_id)::text,'job',r.job_id,floor(extract(epoch from(now()-r.released_at))/3600)::int from released r where r.total>0 and r.passed=r.total
  union all select 'urgent','client_response_overdue','Client response overdue',(r.title||' has been waiting 5+ days')::text,'/workspace/recruiter/client-review','job',r.job_id,floor(extract(epoch from(now()-r.released_at))/3600)::int from released r where r.waiting>0 and r.released_at<=now()-interval '5 days'
  union all select 'high','role_without_shortlist','Role has no shortlist',(rw.title||' has been open for more than 24 hours without candidates')::text,('/workspace/recruiter/matching/'||rw.id)::text,'job',rw.id,floor(extract(epoch from(now()-rw.created_at))/3600)::int from roles_without rw
  union all select 'high','interview_today','Interview today',(j.title||' · candidate interview scheduled today')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job',ci.job_id,greatest(0,floor(extract(epoch from(ci.scheduled_at-now()))/3600)::int) from candidate_interviews ci join jobs j on j.id=ci.job_id where ci.status='scheduled' and timezone('Asia/Manila',ci.scheduled_at)::date=timezone('Asia/Manila',now())::date
  union all select 'high','interview_feedback_missing','Interview completed, feedback missing',(j.title||' needs a Proceed / Hold / Pass decision')::text,('/workspace/recruiter/matching/'||ci.job_id)::text,'job',ci.job_id,floor(extract(epoch from(now()-coalesce(ci.completed_at,ci.scheduled_at)))/3600)::int from candidate_interviews ci join jobs j on j.id=ci.job_id where ci.status='completed' and ci.client_feedback_at is null
  union all select 'high','offer_waiting_va','VA has not accepted offer',(j.title||' · offer waiting for VA response')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job',po.job_id,floor(extract(epoch from(now()-po.created_at))/3600)::int from placement_offers po join jobs j on j.id=po.job_id where po.status='pending_va' and po.created_at<=now()-interval '24 hours'
  union all select 'high','offer_waiting_client','Offer waiting for client confirmation',(j.title||' · VA accepted, client confirmation is pending')::text,('/workspace/recruiter/matching/'||po.job_id)::text,'job',po.job_id,floor(extract(epoch from(now()-coalesce(po.va_accepted_at,po.created_at)))/3600)::int from placement_offers po join jobs j on j.id=po.job_id where po.status='pending_client'
  union all select 'high','candidate_capacity_conflict','Candidate may be double-booked',(coalesce(p.full_name,'VA candidate')||' is active in '||c.roles||' client processes')::text,('/workspace/recruiter/candidates/'||c.va_id)::text,'va',c.va_id,0 from conflicts c left join profiles p on p.id=c.va_id
)
select * from actions order by case priority when 'urgent' then 0 when 'high' then 1 when 'medium' then 2 else 3 end,age_hours desc nulls last;
$$;

create or replace function public.recruiter_operating_metrics()
returns jsonb language sql security definer set search_path=public as $$
with first_shortlist as (select j.id job_id,j.created_at,min(s.released_at) first_released from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.released_at is not null group by j.id,j.created_at),
released_jobs as (select distinct job_id from job_shortlist_candidates where shortlist_status='released'),
interview_jobs as (select distinct job_id from candidate_interviews where status in ('scheduled','completed') union select distinct job_id from applications where status in ('interview','offered','hired')),
hired_jobs as (select distinct job_id from applications where status='hired'),
client_response as (select job_id,min(released_at) released_at,min(client_decision_at) decision_at from job_shortlist_candidates where shortlist_status='released' group by job_id)
select jsonb_build_object(
  'avg_time_to_shortlist_hours',coalesce((select round(avg(extract(epoch from(first_released-created_at))/3600)::numeric,1) from first_shortlist),0),
  'shortlist_to_interview_rate',coalesce((select round(100.0*count(*) filter(where r.job_id in(select job_id from interview_jobs))/nullif(count(*),0),1) from released_jobs r),0),
  'interview_to_hire_rate',coalesce((select round(100.0*count(*) filter(where i.job_id in(select job_id from hired_jobs))/nullif(count(*),0),1) from interview_jobs i),0),
  'avg_client_response_hours',coalesce((select round(avg(extract(epoch from(decision_at-released_at))/3600)::numeric,1) from client_response where decision_at is not null),0),
  'roles_stuck_3d',(select count(*) from jobs j where j.status in ('pending','published') and j.created_at<=now()-interval '3 days' and not exists(select 1 from applications a where a.job_id=j.id and a.status='hired')),
  'placements_30d',(select count(*) from applications where status='hired' and updated_at>=now()-interval '30 days'),
  'offers_waiting',(select count(*) from placement_offers where status in ('pending_va','pending_client')),
  'interviews_next_7d',(select count(*) from candidate_interviews where status='scheduled' and scheduled_at between now() and now()+interval '7 days')
);
$$;

revoke execute on function public.recruiter_daily_action_queue() from public,anon,authenticated;
revoke execute on function public.recruiter_operating_metrics() from public,anon,authenticated;
grant execute on function public.recruiter_daily_action_queue() to service_role;
grant execute on function public.recruiter_operating_metrics() to service_role;
