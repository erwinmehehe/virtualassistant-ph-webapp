-- Agency Operations v2 lifecycle automation and safe backfill.

create or replace function public.sync_lead_stage_from_proposal()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  if new.status='sent' then
    update lead_intake set crm_stage='terms_sent',stage_updated_at=now()
    where id=new.lead_id and crm_stage not in ('won','lost');
  elsif new.status='accepted' then
    update lead_intake set crm_stage='won',won_at=coalesce(won_at,now()),stage_updated_at=now()
    where id=new.lead_id;
  end if;
  return new;
end; $$;
drop trigger if exists lead_proposal_sales_stage_sync on public.lead_proposals;
create trigger lead_proposal_sales_stage_sync after insert or update of status on public.lead_proposals
for each row execute function public.sync_lead_stage_from_proposal();

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

create or replace function public.sync_job_hiring_stage(p_job_id uuid)
returns text language plpgsql security definer set search_path=public as $$
declare v_stage text; v_status public.job_status; v_client uuid; begin
  select status,client_id into v_status,v_client from jobs where id=p_job_id;
  if not found then return null; end if;

  if exists(select 1 from workrooms where job_id=p_job_id) then
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
begin
  if tg_op='DELETE' then perform sync_job_hiring_stage(old.job_id);
  else perform sync_job_hiring_stage(new.job_id); end if;
  return null;
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

-- A confirmed hire becomes a managed placement. Client Success ownership comes
-- from agency settings rather than silently assigning the recruiter.
create or replace function public.initialize_agency_placement()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_owner uuid; v_base timestamptz; begin
  select default_client_success_owner_id into v_owner from admin_settings where id=1;

  update workrooms set
    client_success_owner_id=coalesce(client_success_owner_id,v_owner),
    placement_stage='pre_start',
    placement_stage_entered_at=now(),
    health_status='building'
  where id=new.id;

  insert into workroom_checklist(workroom_id,title,sort_order,owner_role) values
    (new.id,'Provide access to required tools and accounts',1,'client'),
    (new.id,'Review SOPs and training materials',2,'va'),
    (new.id,'Confirm communication and feedback cadence',3,'client'),
    (new.id,'Set first-week priorities and success expectations',4,'client'),
    (new.id,'Confirm business hours and primary manager',5,'client'),
    (new.id,'Confirm 30-day expectations',6,'client'),
    (new.id,'Confirm schedule and start date',7,'va'),
    (new.id,'Confirm equipment and primary internet',8,'va'),
    (new.id,'Confirm backup internet and backup power where applicable',9,'va'),
    (new.id,'Join required communication channels',10,'va'),
    (new.id,'Confirm service terms and billing setup',11,'agency'),
    (new.id,'Assign Client Success owner',12,'agency'),
    (new.id,'Complete recruiter to Client Success handoff',13,'agency')
  on conflict(workroom_id,title) do update set sort_order=excluded.sort_order,owner_role=excluded.owner_role;

  v_base:=coalesce(new.start_date::timestamp at time zone 'Asia/Manila',new.created_at);
  insert into placement_checkins(workroom_id,checkpoint,due_at) values
    (new.id,'day1',v_base+interval '12 hours'),
    (new.id,'day3',v_base+interval '3 days'),
    (new.id,'day7',v_base+interval '7 days'),
    (new.id,'day14',v_base+interval '14 days'),
    (new.id,'day30',v_base+interval '30 days'),
    (new.id,'day60',v_base+interval '60 days'),
    (new.id,'day90',v_base+interval '90 days')
  on conflict(workroom_id,checkpoint,due_at) do nothing;
  return new;
end; $$;
drop trigger if exists workroom_agency_placement_init on public.workrooms;
create trigger workroom_agency_placement_init after insert on public.workrooms
for each row execute function public.initialize_agency_placement();

-- Placement Ready means all pre-start responsibilities are complete, a Client
-- Success owner exists, and the recruiter has formally marked the handoff ready.
create or replace function public.recompute_placement_readiness(p_workroom_id uuid)
returns timestamptz language plpgsql security definer set search_path=public as $$
declare v_all_done boolean; v_owner uuid; v_handoff timestamptz; v_ready timestamptz; begin
  select coalesce(bool_and(completed_at is not null),false)
  into v_all_done from workroom_checklist where workroom_id=p_workroom_id;
  select client_success_owner_id,handoff_ready_at,placement_ready_at
  into v_owner,v_handoff,v_ready from workrooms where id=p_workroom_id;

  if v_all_done and v_owner is not null and v_handoff is not null then
    v_ready:=coalesce(v_ready,now());
  else
    v_ready:=null;
  end if;

  update workrooms set placement_ready_at=v_ready
  where id=p_workroom_id and placement_ready_at is distinct from v_ready;
  return v_ready;
end; $$;

create or replace function public.recompute_placement_readiness_trigger()
returns trigger language plpgsql security definer set search_path=public as $$
declare v_id uuid; begin
  if tg_table_name='workrooms' then v_id:=new.id;
  elsif tg_op='DELETE' then v_id:=old.workroom_id;
  else v_id:=new.workroom_id; end if;
  perform recompute_placement_readiness(v_id);
  return null;
end; $$;
drop trigger if exists checklist_readiness_sync on public.workroom_checklist;
create trigger checklist_readiness_sync after insert or update or delete on public.workroom_checklist
for each row execute function public.recompute_placement_readiness_trigger();
drop trigger if exists handoff_readiness_sync on public.workrooms;
create trigger handoff_readiness_sync after update of handoff_ready_at,client_success_owner_id on public.workrooms
for each row execute function public.recompute_placement_readiness_trigger();

-- Safe backfill for existing workrooms. No generated user id is hard-coded.
update workrooms w
set client_success_owner_id=s.default_client_success_owner_id,
    placement_stage=coalesce(nullif(w.placement_stage,''),'pre_start'),
    health_status=coalesce(w.health_status,'building')
from admin_settings s
where s.id=1 and w.client_success_owner_id is null and s.default_client_success_owner_id is not null;

insert into workroom_checklist(workroom_id,title,sort_order,owner_role)
select w.id,x.title,x.sort_order,x.owner_role from workrooms w cross join (values
  ('Confirm business hours and primary manager',5,'client'),
  ('Confirm 30-day expectations',6,'client'),
  ('Confirm schedule and start date',7,'va'),
  ('Confirm equipment and primary internet',8,'va'),
  ('Confirm backup internet and backup power where applicable',9,'va'),
  ('Join required communication channels',10,'va'),
  ('Confirm service terms and billing setup',11,'agency'),
  ('Assign Client Success owner',12,'agency'),
  ('Complete recruiter to Client Success handoff',13,'agency')
) as x(title,sort_order,owner_role)
on conflict(workroom_id,title) do update set sort_order=excluded.sort_order,owner_role=excluded.owner_role;

insert into placement_checkins(workroom_id,checkpoint,due_at)
select w.id,x.checkpoint,coalesce(w.start_date::timestamp at time zone 'Asia/Manila',w.created_at)+x.offset_value
from workrooms w cross join (values
  ('day1',interval '12 hours'),('day3',interval '3 days'),('day7',interval '7 days'),
  ('day14',interval '14 days'),('day30',interval '30 days'),('day60',interval '60 days'),('day90',interval '90 days')
) as x(checkpoint,offset_value)
on conflict(workroom_id,checkpoint,due_at) do nothing;

select sync_job_hiring_stage(id) from jobs;

revoke execute on function public.sync_lead_stage_from_proposal() from public,anon,authenticated;
revoke execute on function public.set_job_hiring_stage_from_status() from public,anon,authenticated;
revoke execute on function public.sync_job_hiring_stage(uuid) from public,anon,authenticated;
revoke execute on function public.sync_job_hiring_stage_trigger() from public,anon,authenticated;
revoke execute on function public.initialize_agency_placement() from public,anon,authenticated;
revoke execute on function public.recompute_placement_readiness(uuid) from public,anon,authenticated;
revoke execute on function public.recompute_placement_readiness_trigger() from public,anon,authenticated;
grant execute on function public.sync_job_hiring_stage(uuid) to service_role;
grant execute on function public.recompute_placement_readiness(uuid) to service_role;
