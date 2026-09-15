create or replace function public.default_recruiter_id()
returns uuid
language sql
stable
security definer
set search_path=public
as $$
  select p.id
  from profiles p
  where p.role='recruiter' and p.account_status='active'
  order by
    ((select count(*) from lead_intake l where l.owner_id=p.id and coalesce(l.crm_stage,'new') not in ('won','lost'))
    + (select count(*) from jobs j where j.recruiter_id=p.id and j.status in ('pending','published'))) asc,
    p.id
  limit 1;
$$;

create or replace function public.assign_lead_owner()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.owner_id is null and coalesce(new.crm_stage,'new') not in ('won','lost') then
    new.owner_id := public.default_recruiter_id();
  end if;
  return new;
end;
$$;

drop trigger if exists lead_auto_owner on public.lead_intake;
create trigger lead_auto_owner
before insert or update of owner_id,crm_stage on public.lead_intake
for each row execute function public.assign_lead_owner();

create or replace function public.assign_job_recruiter()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_owner uuid;
begin
  if new.recruiter_id is null and new.status in ('pending','published') then
    if new.lead_id is not null then
      select owner_id into v_owner from lead_intake where id=new.lead_id;
    end if;
    new.recruiter_id := coalesce(v_owner, public.default_recruiter_id());
  end if;
  return new;
end;
$$;

drop trigger if exists job_auto_recruiter on public.jobs;
create trigger job_auto_recruiter
before insert or update of recruiter_id,status,lead_id on public.jobs
for each row execute function public.assign_job_recruiter();

update public.lead_intake
set owner_id=public.default_recruiter_id()
where owner_id is null and coalesce(crm_stage,'new') not in ('won','lost');

update public.jobs j
set recruiter_id=coalesce((select l.owner_id from public.lead_intake l where l.id=j.lead_id),public.default_recruiter_id())
where j.recruiter_id is null and j.status in ('pending','published');

insert into public.job_candidate_access(job_id,access_status,access_fee,currency,unlocked_at)
select j.id,'comped',0,'USD',coalesce(j.published_at,now())
from public.jobs j
join public.job_commercials c on c.job_id=j.id and c.commercial_status='accepted'
where j.status='published'
on conflict(job_id) do update
set access_status=case when job_candidate_access.access_status in ('paid','comped') then job_candidate_access.access_status else 'comped' end,
    access_fee=case when job_candidate_access.access_status='paid' then job_candidate_access.access_fee else 0 end,
    unlocked_at=coalesce(job_candidate_access.unlocked_at,excluded.unlocked_at);

update public.job_shortlist_candidates s
set shortlist_status='proposed',released_at=null,updated_at=now()
where s.shortlist_status='released'
  and s.client_decision is null
  and not exists(
    select 1
    from public.jobs j
    join public.job_commercials c on c.job_id=j.id and c.commercial_status='accepted'
    join public.job_candidate_access a on a.job_id=j.id and a.access_status in ('paid','comped')
    where j.id=s.job_id and j.client_id is not null and j.status='published'
  );

create or replace function public.enforce_client_visible_shortlist()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.shortlist_status='released' and (tg_op='INSERT' or old.shortlist_status is distinct from 'released') then
    if not exists(
      select 1
      from jobs j
      join job_commercials c on c.job_id=j.id and c.commercial_status='accepted'
      join job_candidate_access a on a.job_id=j.id and a.access_status in ('paid','comped')
      where j.id=new.job_id and j.client_id is not null and j.status='published'
    ) then
      raise exception 'Client review is not ready yet. Link the client and activate the approved service terms before sending the shortlist.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists shortlist_release_guard on public.job_shortlist_candidates;
create trigger shortlist_release_guard
before insert or update of shortlist_status on public.job_shortlist_candidates
for each row execute function public.enforce_client_visible_shortlist();

create or replace function public.create_placement_followup_tasks()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_recruiter uuid; v_base timestamptz; begin
  select recruiter_id into v_recruiter from jobs where id=new.job_id;
  v_recruiter:=coalesce(v_recruiter,public.default_recruiter_id());
  if v_recruiter is null then return new; end if;
  v_base:=greatest(coalesce(new.created_at,now()),coalesce(new.start_date::timestamptz,now()));
  insert into recruiter_tasks(title,description,assignee_id,created_by,subject_type,subject_id,href,priority,status,due_at)
  values
    ('Day 3 placement setup','Confirm the VA has access, tools, SOPs, priorities, and a working communication channel. Escalate only real blockers.',v_recruiter,null,'workroom',new.id,'/workspace/recruiter/today','high','todo',v_base+interval '3 days'),
    ('Day 7 placement health','Check whether the client and VA are operating smoothly. Capture concerns early and create a recovery action only if needed.',v_recruiter,null,'workroom',new.id,'/workspace/recruiter/today','normal','todo',v_base+interval '7 days'),
    ('Day 30 placement review','Confirm placement stability, client satisfaction, VA workload, and whether the engagement should continue unchanged.',v_recruiter,null,'workroom',new.id,'/workspace/recruiter/today','normal','todo',v_base+interval '30 days');
  return new;
end;
$$;

drop trigger if exists workroom_followup_tasks on public.workrooms;
create trigger workroom_followup_tasks
after insert on public.workrooms
for each row execute function public.create_placement_followup_tasks();

create or replace function public.client_dashboard_summary(p_client_id uuid)
returns jsonb
language sql
stable security definer
set search_path=public
as $$
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
    'job_count',(select count(*)::int from client_jobs),
    'active_jobs',(select count(*)::int from client_jobs where status='published'),
    'hire_count',(select count(*)::int from work),
    'application_count',a.application_count,
    'unread_messages',u.messages,
    'pipeline',jsonb_build_object('applied',a.applied,'shortlisted',a.shortlisted,'interview',a.interview,'offered',a.offered,'hired',a.hired,'rejected',a.rejected),
    'jobs',coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from recent_jobs r),'[]'::jsonb)
  ) from app_metrics a cross join unread u;
$$;

revoke execute on function public.default_recruiter_id() from public,anon,authenticated;
grant execute on function public.default_recruiter_id() to service_role;
