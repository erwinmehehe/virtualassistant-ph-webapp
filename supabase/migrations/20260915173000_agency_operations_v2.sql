-- Agency Operations v2
-- Canonical Sales -> Hiring -> Placement lifecycle with explicit recruiter and
-- Client Success ownership. Keep the operating model managed-service first.

-- Sales stays on lead_intake.crm_stage. Rename the old proposal-ish stage in
-- practice without breaking an older deployment that may still write it.
alter table public.lead_intake drop constraint if exists lead_intake_crm_stage_check;
alter table public.lead_intake add constraint lead_intake_crm_stage_check check (
  crm_stage = any (array[
    'new'::text,'contacted'::text,'discovery_booked'::text,'qualified'::text,
    'terms_sent'::text,'shortlist_sent'::text,'nurture'::text,'won'::text,'lost'::text
  ])
);
update public.lead_intake set crm_stage='terms_sent' where crm_stage='shortlist_sent';

-- Hiring lifecycle belongs to the role/job, independent from the Sales stage.
alter table public.jobs add column if not exists hiring_stage text not null default 'intake';
alter table public.jobs add column if not exists hiring_stage_entered_at timestamptz not null default now();
alter table public.jobs add column if not exists target_start_date date;
alter table public.jobs drop constraint if exists jobs_hiring_stage_check;
alter table public.jobs add constraint jobs_hiring_stage_check check (
  hiring_stage = any (array[
    'intake'::text,'ready_to_recruit'::text,'sourcing'::text,'internal_review'::text,
    'client_review'::text,'interviewing'::text,'selected'::text,'offer'::text,
    'pre_start'::text,'filled'::text,'closed'::text
  ])
);
create index if not exists jobs_recruiter_hiring_stage_idx on public.jobs(recruiter_id,hiring_stage,hiring_stage_entered_at desc);

-- Placement lifecycle is a separate operating object after a successful hire.
alter table public.workrooms add column if not exists client_success_owner_id uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists placement_stage text not null default 'onboarding';
alter table public.workrooms add column if not exists placement_stage_entered_at timestamptz not null default now();
alter table public.workrooms add column if not exists handoff_completed_at timestamptz;
alter table public.workrooms add column if not exists handoff_completed_by uuid references public.profiles(id) on delete set null;
alter table public.workrooms add column if not exists handoff_notes text;
alter table public.workrooms add column if not exists placement_ready_at timestamptz;
alter table public.workrooms add column if not exists at_risk_reason text;
alter table public.workrooms add column if not exists recovery_plan text;
alter table public.workrooms add column if not exists ended_at timestamptz;
alter table public.workrooms drop constraint if exists workrooms_placement_stage_check;
alter table public.workrooms add constraint workrooms_placement_stage_check check (
  placement_stage = any (array[
    'onboarding'::text,'healthy'::text,'watch'::text,'at_risk'::text,
    'recovery'::text,'replacement'::text,'ended'::text
  ])
);
create index if not exists workrooms_csm_stage_idx on public.workrooms(client_success_owner_id,placement_stage,placement_stage_entered_at desc);

-- Agency-owned readiness items live beside the existing client/VA checklist.
alter table public.workroom_checklist drop constraint if exists workroom_checklist_owner_role_check;
alter table public.workroom_checklist add constraint workroom_checklist_owner_role_check
  check (owner_role = any (array['client'::text,'va'::text,'agency'::text]));

-- Client Success check-ins are server-only operational records.
create table if not exists public.placement_checkins (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  checkpoint text not null check (checkpoint in ('day3','day7','day14','day30')),
  due_at timestamptz not null,
  status text not null default 'todo' check (status in ('todo','completed','skipped')),
  client_signal text check (client_signal is null or client_signal in ('green','yellow','red')),
  va_signal text check (va_signal is null or va_signal in ('green','yellow','red')),
  notes text check (notes is null or char_length(notes)<=4000),
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(workroom_id,checkpoint)
);
alter table public.placement_checkins enable row level security;
revoke all on table public.placement_checkins from public,anon,authenticated;
grant select,insert,update,delete on table public.placement_checkins to service_role;
create index if not exists placement_checkins_due_idx on public.placement_checkins(status,due_at);
create index if not exists placement_checkins_workroom_idx on public.placement_checkins(workroom_id,due_at);

-- Keep sales stages canonical when proposals move.
create or replace function public.sync_lead_stage_from_proposal()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='sent' and (tg_op='INSERT' or old.status is distinct from new.status) then
    update lead_intake set crm_stage='terms_sent',stage_updated_at=now()
    where id=new.lead_id and crm_stage not in ('won','lost');
  elsif new.status='accepted' and (tg_op='INSERT' or old.status is distinct from new.status) then
    update lead_intake set crm_stage='won',won_at=coalesce(won_at,now()),stage_updated_at=now()
    where id=new.lead_id;
  end if;
  return new;
end; $$;
drop trigger if exists lead_proposal_sales_stage_sync on public.lead_proposals;
create trigger lead_proposal_sales_stage_sync after insert or update of status on public.lead_proposals
for each row execute function public.sync_lead_stage_from_proposal();

-- Own-field status changes establish the early hiring stages.
create or replace function public.set_job_hiring_stage_from_status()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.status='closed' and coalesce(new.hiring_stage,'')<>'filled' then
    new.hiring_stage:='closed';
  elsif new.status='draft' then
    new.hiring_stage:='intake';
  elsif new.status='pending' and new.client_id is not null and new.hiring_stage='intake' then
    new.hiring_stage:='ready_to_recruit';
  elsif new.status='published' and new.hiring_stage in ('intake','ready_to_recruit') then
    new.hiring_stage:='sourcing';
  end if;
  if tg_op='INSERT' or new.hiring_stage is distinct from old.hiring_stage then
    new.hiring_stage_entered_at:=now();
  end if;
  return new;
end; $$;
drop trigger if exists jobs_hiring_stage_from_status on public.jobs;
create trigger jobs_hiring_stage_from_status
before insert or update of status,client_id,hiring_stage on public.jobs
for each row execute function public.set_job_hiring_stage_from_status();

-- Canonical hiring stage is derived from the managed-agency workflow objects.
create or replace function public.sync_job_hiring_stage(p_job_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_stage text; v_status job_status; v_client uuid; begin
  select status,client_id into v_status,v_client from jobs where id=p_job_id;
  if not found then return null; end if;

  if exists(select 1 from workrooms where job_id=p_job_id and status in ('active','paused','completed')) then
    v_stage:='filled';
  elsif exists(select 1 from placement_offers where job_id=p_job_id and status='accepted') then
    v_stage:='pre_start';
  elsif exists(select 1 from placement_offers where job_id=p_job_id and status in ('pending_va','pending_client')) then
    v_stage:='offer';
  elsif exists(select 1 from candidate_interviews where job_id=p_job_id and status='completed' and client_decision='proceed') then
    v_stage:='selected';
  elsif exists(select 1 from candidate_interviews where job_id=p_job_id and status in ('requested','scheduled'))
     or exists(select 1 from candidate_interviews where job_id=p_job_id and status='completed' and client_decision='hold') then
    v_stage:='interviewing';
  elsif exists(select 1 from job_shortlist_candidates where job_id=p_job_id and shortlist_status='released')
    and not exists(select 1 from job_shortlist_candidates where job_id=p_job_id and shortlist_status='released' and coalesce(client_decision,'')<>'pass') then
    v_stage:='sourcing';
  elsif exists(select 1 from job_shortlist_candidates where job_id=p_job_id and shortlist_status='released') then
    v_stage:='client_review';
  elsif exists(select 1 from job_shortlist_candidates where job_id=p_job_id and shortlist_status='proposed') then
    v_stage:='internal_review';
  elsif v_status='closed' then
    v_stage:='closed';
  elsif v_status='published' then
    v_stage:='sourcing';
  elsif v_client is not null then
    v_stage:='ready_to_recruit';
  else
    v_stage:='intake';
  end if;

  update jobs set hiring_stage=v_stage where id=p_job_id and hiring_stage is distinct from v_stage;
  return v_stage;
end; $$;

create or replace function public.sync_job_hiring_stage_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_job_id uuid; begin
  if tg_op='DELETE' then v_job_id:=old.job_id; else v_job_id:=new.job_id; end if;
  perform sync_job_hiring_stage(v_job_id);
  return coalesce(new,old);
end; $$;

drop trigger if exists shortlist_hiring_stage_sync on public.job_shortlist_candidates;
create trigger shortlist_hiring_stage_sync after insert or update or delete on public.job_shortlist_candidates
for each row execute function public.sync_job_hiring_stage_trigger();
drop trigger if exists interview_hiring_stage_sync on public.candidate_interviews;
create trigger interview_hiring_stage_sync after insert or update or delete on public.candidate_interviews
for each row execute function public.sync_job_hiring_stage_trigger();
drop trigger if exists offer_hiring_stage_sync on public.placement_offers;
create trigger offer_hiring_stage_sync after insert or update or delete on public.placement_offers
for each row execute function public.sync_job_hiring_stage_trigger();
drop trigger if exists workroom_hiring_stage_sync on public.workrooms;
create trigger workroom_hiring_stage_sync after insert or update or delete on public.workrooms
for each row execute function public.sync_job_hiring_stage_trigger();

-- A successful hire starts Client Success ownership, readiness, and check-ins.
create or replace function public.initialize_agency_placement()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_owner uuid; v_base timestamptz; begin
  select coalesce(j.recruiter_id,(
    select p.id from profiles p where p.role='recruiter' and p.account_status='active' order by p.created_at limit 1
  )) into v_owner from jobs j where j.id=new.job_id;

  update workrooms set
    client_success_owner_id=coalesce(client_success_owner_id,v_owner),
    placement_stage=coalesce(placement_stage,'onboarding'),
    placement_stage_entered_at=coalesce(placement_stage_entered_at,now())
  where id=new.id;

  insert into workroom_checklist(workroom_id,title,sort_order,owner_role) values
    (new.id,'Confirm business hours and primary manager',5,'client'),
    (new.id,'Provide first-week tasks and success expectations',6,'client'),
    (new.id,'Confirm schedule and start date',7,'va'),
    (new.id,'Confirm equipment, internet, and backup connection',8,'va'),
    (new.id,'Join client communication channels',9,'va'),
    (new.id,'Confirm service terms and billing setup',10,'agency'),
    (new.id,'Assign Client Success owner',11,'agency'),
    (new.id,'Complete recruiter to Client Success handoff',12,'agency')
  on conflict do nothing;

  v_base:=coalesce(new.start_date::timestamptz,new.created_at);
  insert into placement_checkins(workroom_id,checkpoint,due_at) values
    (new.id,'day3',v_base+interval '3 days'),
    (new.id,'day7',v_base+interval '7 days'),
    (new.id,'day14',v_base+interval '14 days'),
    (new.id,'day30',v_base+interval '30 days')
  on conflict(workroom_id,checkpoint) do nothing;
  return new;
end; $$;
drop trigger if exists workroom_agency_placement_init on public.workrooms;
create trigger workroom_agency_placement_init after insert on public.workrooms
for each row execute function public.initialize_agency_placement();

-- Placement Ready is an evidence-based flag: all readiness items + formal handoff.
create or replace function public.recompute_placement_readiness(p_workroom_id uuid)
returns timestamptz language plpgsql security definer set search_path=public as $$
declare v_all_done boolean; v_handoff timestamptz; v_ready timestamptz; begin
  select coalesce(bool_and(completed_at is not null),false) into v_all_done from workroom_checklist where workroom_id=p_workroom_id;
  select handoff_completed_at,placement_ready_at into v_handoff,v_ready from workrooms where id=p_workroom_id;
  if v_all_done and v_handoff is not null then
    v_ready:=coalesce(v_ready,now());
  else
    v_ready:=null;
  end if;
  update workrooms set placement_ready_at=v_ready where id=p_workroom_id and placement_ready_at is distinct from v_ready;
  return v_ready;
end; $$;

create or replace function public.recompute_placement_readiness_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_id uuid; begin
  if tg_table_name='workrooms' then v_id:=new.id;
  elsif tg_op='DELETE' then v_id:=old.workroom_id;
  else v_id:=new.workroom_id; end if;
  perform recompute_placement_readiness(v_id);
  return coalesce(new,old);
end; $$;
drop trigger if exists checklist_readiness_sync on public.workroom_checklist;
create trigger checklist_readiness_sync after insert or update or delete on public.workroom_checklist
for each row execute function public.recompute_placement_readiness_trigger();
drop trigger if exists handoff_readiness_sync on public.workrooms;
create trigger handoff_readiness_sync after update of handoff_completed_at on public.workrooms
for each row execute function public.recompute_placement_readiness_trigger();

-- Backfill current data without hardcoding staff identities.
update workrooms w set client_success_owner_id=coalesce(w.client_success_owner_id,j.recruiter_id,(
  select p.id from profiles p where p.role='recruiter' and p.account_status='active' order by p.created_at limit 1
)) from jobs j where j.id=w.job_id and w.client_success_owner_id is null;

insert into workroom_checklist(workroom_id,title,sort_order,owner_role)
select w.id,x.title,x.sort_order,x.owner_role from workrooms w cross join (values
  ('Confirm business hours and primary manager',5,'client'),
  ('Provide first-week tasks and success expectations',6,'client'),
  ('Confirm schedule and start date',7,'va'),
  ('Confirm equipment, internet, and backup connection',8,'va'),
  ('Join client communication channels',9,'va'),
  ('Confirm service terms and billing setup',10,'agency'),
  ('Assign Client Success owner',11,'agency'),
  ('Complete recruiter to Client Success handoff',12,'agency')
) as x(title,sort_order,owner_role)
on conflict do nothing;

insert into placement_checkins(workroom_id,checkpoint,due_at)
select w.id,x.checkpoint,coalesce(w.start_date::timestamptz,w.created_at)+x.offset_value
from workrooms w cross join (values
  ('day3',interval '3 days'),('day7',interval '7 days'),('day14',interval '14 days'),('day30',interval '30 days')
) as x(checkpoint,offset_value)
on conflict(workroom_id,checkpoint) do nothing;

select sync_job_hiring_stage(id) from jobs;

-- Client Success work belongs in My Day when the same person currently carries
-- both recruiter and Client Success responsibility.
create or replace function public.recruiter_today_queue(p_user_id uuid,p_limit integer default 20)
returns jsonb
language sql
stable security definer
set search_path=public as $$
  with items(priority_rank,priority,kind,id,title,subtitle,due_at,href,action_url,metadata,sort_distance) as (
    select case when t.due_at is not null and t.due_at<=now() then 0 when t.priority='urgent' then 0 when t.priority='high' then 1 when t.priority='normal' then 2 else 3 end,
      t.priority,'task'::text,t.id,t.title,coalesce(nullif(t.description,''),'Recruiter task'),t.due_at,coalesce(t.href,'/workspace/recruiter/tasks'),null::text,
      jsonb_build_object('repeat_rule',t.repeat_rule,'subject_type',t.subject_type,'subject_id',t.subject_id),
      abs(extract(epoch from(coalesce(t.due_at,now())-now()))
    from recruiter_tasks t
    where t.assignee_id=p_user_id and t.status='todo'
      and (t.snoozed_until is null or t.snoozed_until<=now())
      and (t.due_at is null or t.due_at between now()-interval '14 days' and now()+interval '1 day')

    union all
    select 0,'urgent'::text,'lead_first_contact'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),nullif(l.service,''),nullif(l.email,'')),l.created_at,
      '/workspace/recruiter/leads?view=attention'::text,null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.created_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null
      and l.created_at>=now()-interval '14 days' and l.owner_id=p_user_id

    union all
    select 0,'urgent'::text,'lead_followup'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',nullif(l.name,''),'Follow-up due',nullif(l.service,'')),l.next_follow_up_at,
      '/workspace/recruiter/leads?view=attention'::text,null::text,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'service',l.service),
      abs(extract(epoch from(now()-l.next_follow_up_at)))
    from lead_intake l
    where coalesce(l.crm_stage,'new') in ('new','contacted','discovery_booked','qualified','terms_sent','shortlist_sent','nurture')
      and l.next_follow_up_at between now()-interval '7 days' and now()
      and not(coalesce(l.crm_stage,'new')='new' and l.first_contact_at is null)
      and l.owner_id=p_user_id

    union all
    select 1,'high'::text,'discovery'::text,l.id,coalesce(nullif(l.company,''),nullif(l.name,''),l.email),
      concat_ws(' · ',coalesce(nullif(l.name,''),'Client'),'Discovery call',nullif(l.timezone,'')),l.discovery_scheduled_at,
      '/workspace/recruiter/leads?view=discovery'::text,l.discovery_meeting_url,
      jsonb_build_object('lead_id',l.id,'name',l.name,'email',l.email,'company',l.company,'timezone',l.timezone,'duration',l.discovery_duration_minutes),
      abs(extract(epoch from(l.discovery_scheduled_at-now())))
    from lead_intake l
    where l.discovery_scheduled_at is not null and l.discovery_completed_at is null and l.discovery_cancelled_at is null
      and l.discovery_scheduled_at>=now()-interval '1 hour' and l.discovery_scheduled_at<=now()+interval '48 hours'
      and l.owner_id=p_user_id

    union all
    select 2,'normal'::text,'vetting'::text,vv.va_id,coalesce(nullif(p.full_name,''),'VA candidate'),'Recruiter review waiting'::text,
      vv.updated_at,('/workspace/recruiter/candidates/'||vv.va_id)::text,null::text,jsonb_build_object('va_id',vv.va_id),
      abs(extract(epoch from(now()-vv.updated_at)))
    from va_vetting vv left join profiles p on p.id=vv.va_id
    where vv.stage='recruiter_review' and vv.recruiter_id=p_user_id and vv.updated_at>=now()-interval '14 days'

    union all
    select case when q.priority='urgent' then 0 when q.priority='high' then 1 else 2 end,
      q.priority,q.action_type,q.subject_id,q.title,q.description,now()-(q.age_hours||' hours')::interval,
      case
        when q.subject_type='job' then '/workspace/recruiter/roles/'||q.subject_id
        when q.subject_type='va' then '/workspace/recruiter/candidates/'||q.subject_id
        else q.href
      end,
      null::text,jsonb_build_object('subject_type',q.subject_type,'subject_id',q.subject_id),(q.age_hours*3600)::numeric
    from recruiter_daily_action_queue(p_user_id) q
    where not(q.action_type='client_shortlist_waiting' and q.age_hours>=120)

    union all
    select case when pc.due_at<=now() then 0 else 1 end,
      case when pc.due_at<=now() then 'urgent' else 'high' end::text,
      'placement_checkin'::text,pc.id,
      ('Placement '||replace(pc.checkpoint,'day','Day ')||' check-in')::text,
      (j.title||' · Client Success follow-up')::text,pc.due_at,
      ('/workspace/recruiter/placements/'||w.id)::text,null::text,
      jsonb_build_object('workroom_id',w.id,'job_id',w.job_id,'checkpoint',pc.checkpoint),
      abs(extract(epoch from(pc.due_at-now())))
    from placement_checkins pc join workrooms w on w.id=pc.workroom_id join jobs j on j.id=w.job_id
    where w.client_success_owner_id=p_user_id and pc.status='todo'
      and pc.due_at between now()-interval '14 days' and now()+interval '1 day'
      and w.placement_stage<>'ended'

    union all
    select 0,'urgent'::text,'placement_risk'::text,w.id,'Placement needs attention',
      (j.title||' · '||replace(w.placement_stage,'_',' '))::text,now(),
      ('/workspace/recruiter/placements/'||w.id)::text,null::text,
      jsonb_build_object('workroom_id',w.id,'job_id',w.job_id,'stage',w.placement_stage),0::numeric
    from workrooms w join jobs j on j.id=w.job_id
    where w.client_success_owner_id=p_user_id and w.placement_stage in ('at_risk','recovery','replacement')

    union all
    select 1,'high'::text,'placement_handoff'::text,w.id,'Placement handoff incomplete',
      (j.title||' · complete recruiter to Client Success handoff')::text,
      coalesce(w.start_date::timestamptz,w.created_at),('/workspace/recruiter/placements/'||w.id)::text,null::text,
      jsonb_build_object('workroom_id',w.id,'job_id',w.job_id),
      abs(extract(epoch from(coalesce(w.start_date::timestamptz,w.created_at)-now())))
    from workrooms w join jobs j on j.id=w.job_id
    where w.client_success_owner_id=p_user_id and w.handoff_completed_at is null and w.placement_stage<>'ended'
      and coalesce(w.start_date::timestamptz,w.created_at)<=now()+interval '2 days'
  ),
  deduped as(
    select distinct on(kind,id) * from items order by kind,id,priority_rank asc,sort_distance asc
  ),
  ranked as(
    select * from deduped order by priority_rank asc,sort_distance asc,title asc limit greatest(coalesce(p_limit,20),1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'priority',priority,'kind',kind,'id',id,'title',title,'subtitle',subtitle,
    'due_at',due_at,'href',href,'action_url',action_url,'metadata',metadata
  ) order by priority_rank asc,sort_distance asc,title asc),'[]'::jsonb)
  from ranked;
$$;

-- Lock down operational helper functions; they are invoked by triggers or the server.
revoke execute on function public.sync_lead_stage_from_proposal() from public,anon,authenticated;
revoke execute on function public.sync_job_hiring_stage(uuid) from public,anon,authenticated;
revoke execute on function public.sync_job_hiring_stage_trigger() from public,anon,authenticated;
revoke execute on function public.initialize_agency_placement() from public,anon,authenticated;
revoke execute on function public.recompute_placement_readiness(uuid) from public,anon,authenticated;
revoke execute on function public.recompute_placement_readiness_trigger() from public,anon,authenticated;
revoke execute on function public.recruiter_today_queue(uuid,integer) from public,anon,authenticated;
grant execute on function public.sync_job_hiring_stage(uuid) to service_role;
grant execute on function public.recompute_placement_readiness(uuid) to service_role;
grant execute on function public.recruiter_today_queue(uuid,integer) to service_role;
