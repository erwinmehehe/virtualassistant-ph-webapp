-- Final recruiter-operations automation and safety wiring.
-- Automatic matching creates recruiter-only suggestions. Nothing here releases a VA to a client.

create or replace function public.array_contains_all_ci(required_values text[], supplied_values text[])
returns boolean
language sql
immutable
set search_path=public
as $$
  select not exists (
    select 1 from unnest(coalesce(required_values,'{}'::text[])) req
    where not exists (
      select 1 from unnest(coalesce(supplied_values,'{}'::text[])) supplied
      where lower(trim(supplied)) = lower(trim(req))
    )
  );
$$;

create or replace function public.array_overlap_count_ci(required_values text[], supplied_values text[])
returns integer
language sql
immutable
set search_path=public
as $$
  select count(*)::integer
  from unnest(coalesce(required_values,'{}'::text[])) req
  where exists (
    select 1 from unnest(coalesce(supplied_values,'{}'::text[])) supplied
    where lower(trim(supplied)) = lower(trim(req))
  );
$$;

create or replace function public.refresh_match_suggestions_for_va(p_va_id uuid)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  v record;
  j record;
  raw_score numeric;
  assessed integer;
  normalized integer;
  proposed_count integer := 0;
  existed boolean;
begin
  select vp.*, vv.stage into v
  from va_profiles vp join va_vetting vv on vv.va_id=vp.user_id
  where vp.user_id=p_va_id and vv.stage in ('approved','bench');
  if not found or coalesce(v.availability_status,'') <> 'available' then return 0; end if;

  for j in select * from jobs where status in ('pending','published') loop
    if not public.array_contains_all_ci(j.must_have_skills,v.skills) then continue; end if;
    if not public.array_contains_all_ci(j.must_have_tools,v.tools) then continue; end if;
    if not public.array_contains_all_ci(j.required_industries,v.industries) then continue; end if;
    if j.minimum_years_experience is not null and coalesce(v.years_experience,0) < j.minimum_years_experience then continue; end if;
    if j.hours_per_week is not null and coalesce(v.weekly_hours,0) < j.hours_per_week then continue; end if;
    if j.overlap_hours is not null and coalesce(v.overlap_hours,0) < j.overlap_hours then continue; end if;
    if j.max_hourly_rate is not null and v.hourly_rate is not null and v.hourly_rate > j.max_hourly_rate then continue; end if;
    if exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.va_id=p_va_id and s.shortlist_status in ('hidden','released')) then continue; end if;

    raw_score := 0; assessed := 0;
    if cardinality(coalesce(j.categories,'{}')) > 0 then
      assessed := assessed + 30;
      if public.array_overlap_count_ci(j.categories,array_prepend(v.primary_category,coalesce(v.categories,'{}'))) > 0 then raw_score := raw_score + 30; end if;
    end if;
    if cardinality(coalesce(j.required_skills,'{}')) > 0 then
      assessed := assessed + 25;
      raw_score := raw_score + 25.0 * public.array_overlap_count_ci(j.required_skills,v.skills) / greatest(cardinality(j.required_skills),1);
    end if;
    if cardinality(coalesce(j.required_tools,'{}')) > 0 then
      assessed := assessed + 15;
      raw_score := raw_score + 15.0 * public.array_overlap_count_ci(j.required_tools,v.tools) / greatest(cardinality(j.required_tools),1);
    end if;
    if cardinality(coalesce(j.nice_to_have_skills,'{}')) > 0 then
      assessed := assessed + 10;
      raw_score := raw_score + 10.0 * public.array_overlap_count_ci(j.nice_to_have_skills,v.skills) / greatest(cardinality(j.nice_to_have_skills),1);
    end if;
    if j.hours_per_week is not null then assessed := assessed + 10; raw_score := raw_score + 10; end if;
    if j.overlap_hours is not null then assessed := assessed + 10; raw_score := raw_score + 10; end if;
    normalized := case when assessed=0 then 0 else least(100,round(raw_score/assessed*100))::integer end;
    if normalized < 60 then continue; end if;

    select exists(select 1 from job_shortlist_candidates s where s.job_id=j.id and s.va_id=p_va_id) into existed;
    insert into job_shortlist_candidates(job_id,va_id,match_score,match_confidence,shortlist_status,created_by,released_at)
    values(j.id,p_va_id,normalized,least(100,assessed),'proposed',null,null)
    on conflict(job_id,va_id) do update set
      match_score=excluded.match_score, match_confidence=excluded.match_confidence, updated_at=now()
    where job_shortlist_candidates.shortlist_status='proposed';
    if not existed then proposed_count := proposed_count + 1; end if;
  end loop;

  if proposed_count > 0 then
    insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata)
    values('va',p_va_id,'automatic_match_refresh',proposed_count || ' new recruiter-only role suggestion(s) found',null,jsonb_build_object('suggestions',proposed_count));
  end if;
  return proposed_count;
end;
$$;

create or replace function public.refresh_all_match_suggestions()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare r record; total integer:=0; begin
  for r in select va_id from va_vetting where stage in ('approved','bench') loop
    total := total + public.refresh_match_suggestions_for_va(r.va_id);
  end loop;
  return total;
end;
$$;

create or replace function public.trigger_refresh_job_matches()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.status in ('pending','published') then perform public.refresh_all_match_suggestions(); end if;
  return new;
end;
$$;

create or replace function public.trigger_refresh_va_matches()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  perform public.refresh_match_suggestions_for_va(new.user_id);
  return new;
end;
$$;

create or replace function public.trigger_refresh_vetting_matches()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.stage in ('approved','bench') and old.stage is distinct from new.stage then perform public.refresh_match_suggestions_for_va(new.va_id); end if;
  return new;
end;
$$;

drop trigger if exists job_match_refresh on public.jobs;
create trigger job_match_refresh after update of categories,required_skills,required_tools,must_have_skills,nice_to_have_skills,must_have_tools,required_industries,minimum_years_experience,hours_per_week,overlap_hours,max_hourly_rate,status on public.jobs for each row execute function public.trigger_refresh_job_matches();

drop trigger if exists va_profile_match_refresh on public.va_profiles;
create trigger va_profile_match_refresh after update of primary_category,categories,skills,tools,industries,years_experience,weekly_hours,overlap_hours,hourly_rate,availability_status on public.va_profiles for each row execute function public.trigger_refresh_va_matches();

drop trigger if exists va_vetting_match_refresh on public.va_vetting;
create trigger va_vetting_match_refresh after update of stage on public.va_vetting for each row execute function public.trigger_refresh_vetting_matches();

create or replace function public.recruiter_candidate_intelligence(p_va_id uuid)
returns jsonb
language sql
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'presented', (select count(*) from job_shortlist_candidates where va_id=p_va_id and shortlist_status='released'),
    'interviews', (select count(*) from candidate_interviews where va_id=p_va_id and status in ('scheduled','completed')) + (select count(*) from applications where va_id=p_va_id and status in ('interview','offered','hired')),
    'passes', (select count(*) from job_shortlist_candidates where va_id=p_va_id and client_decision='pass'),
    'offers', (select count(*) from placement_offers where va_id=p_va_id),
    'placements', (select count(*) from applications where va_id=p_va_id and status='hired'),
    'pass_reasons', coalesce((select jsonb_agg(jsonb_build_object('reason',reason,'count',n) order by n desc) from (select coalesce(nullif(client_decision_note,''),'No reason supplied') reason,count(*) n from job_shortlist_candidates where va_id=p_va_id and client_decision='pass' group by 1 order by n desc limit 5) x),'[]'::jsonb)
  );
$$;

create or replace function public.recruiter_talent_health()
returns table(va_id uuid, full_name text, health text, last_activity_at timestamptz, active_processes bigint)
language sql
security definer
set search_path=public
as $$
  with active as (
    select va_id,count(*) active_processes from applications where status in ('shortlisted','interview','offered','hired') group by va_id
  ), presented as (
    select va_id,count(*) n from job_shortlist_candidates where shortlist_status in ('proposed','released') and client_decision is distinct from 'pass' group by va_id
  ), placed as (select distinct va_id from applications where status='hired')
  select vp.user_id,p.full_name,
    case
      when pl.va_id is not null then 'Placed'
      when coalesce(a.active_processes,0)>0 or coalesce(pr.n,0)>0 then 'Active'
      when greatest(coalesce(p.last_active_at,'epoch'),coalesce(vp.updated_at,'epoch')) >= now()-interval '14 days' and vp.availability_status='available' then 'Hot'
      when greatest(coalesce(p.last_active_at,'epoch'),coalesce(vp.updated_at,'epoch')) < now()-interval '60 days' then 'Stale'
      when greatest(coalesce(p.last_active_at,'epoch'),coalesce(vp.updated_at,'epoch')) < now()-interval '30 days' then 'Cooling'
      else 'Hot' end,
    greatest(p.last_active_at,vp.updated_at),coalesce(a.active_processes,0)
  from va_profiles vp join profiles p on p.id=vp.user_id join va_vetting vv on vv.va_id=vp.user_id and vv.stage in ('approved','bench')
  left join active a on a.va_id=vp.user_id left join presented pr on pr.va_id=vp.user_id left join placed pl on pl.va_id=vp.user_id;
$$;

create or replace function public.recruiter_client_followup_sweep()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare r record; clients24 int:=0; clients48 int:=0; escalations int:=0; overdue int:=0; rec record; begin
  for r in
    select j.id,j.title,j.client_id,j.recruiter_id,min(s.released_at) released_at
    from jobs j join job_shortlist_candidates s on s.job_id=j.id and s.shortlist_status='released'
    where j.status<>'closed' and j.client_id is not null
    group by j.id,j.title,j.client_id,j.recruiter_id
    having count(*) filter(where s.client_decision is not null)=0
  loop
    if r.released_at <= now()-interval '24 hours' and not exists(select 1 from recruiter_activity where subject_type='job' and subject_id=r.id and action='auto_client_followup_24h') then
      insert into notifications(user_id,title,body,href,type,priority) values(r.client_id,'Your shortlist is ready',r.title || ': your recruiter has prepared candidates for review.','/workspace/client/candidates?role='||r.id,'shortlist_followup','normal');
      insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata) values('job',r.id,'auto_client_followup_24h','Automatic 24-hour shortlist reminder sent',null,'{}'); clients24:=clients24+1;
    end if;
    if r.released_at <= now()-interval '48 hours' and not exists(select 1 from recruiter_activity where subject_type='job' and subject_id=r.id and action='auto_client_followup_48h') then
      insert into notifications(user_id,title,body,href,type,priority) values(r.client_id,'Candidates may become unavailable',r.title || ': please review your shortlist while the candidates are still available.','/workspace/client/candidates?role='||r.id,'shortlist_followup','high');
      insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata) values('job',r.id,'auto_client_followup_48h','Automatic 48-hour shortlist reminder sent',null,'{}'); clients48:=clients48+1;
    end if;
    if r.released_at <= now()-interval '72 hours' and not exists(select 1 from recruiter_tasks where subject_type='job' and subject_id=r.id and title='Client shortlist follow-up overdue' and status='todo') then
      if r.recruiter_id is not null then
        insert into recruiter_tasks(title,description,assignee_id,subject_type,subject_id,href,priority,status,due_at) values('Client shortlist follow-up overdue',r.title || ' has had no client response for 72+ hours.',r.recruiter_id,'job',r.id,'/workspace/recruiter/client-review','high','todo',now());
      else
        for rec in select id from profiles where role='recruiter' loop
          insert into recruiter_tasks(title,description,assignee_id,subject_type,subject_id,href,priority,status,due_at) values('Client shortlist follow-up overdue',r.title || ' has had no client response for 72+ hours.',rec.id,'job',r.id,'/workspace/recruiter/client-review','high','todo',now());
        end loop;
      end if; escalations:=escalations+1;
    end if;
    if r.released_at <= now()-interval '5 days' and not exists(select 1 from recruiter_activity where subject_type='job' and subject_id=r.id and action='client_response_overdue_5d') then
      insert into recruiter_activity(subject_type,subject_id,action,description,actor_id,metadata) values('job',r.id,'client_response_overdue_5d','Client has not responded to shortlist for 5+ days',null,'{}'); overdue:=overdue+1;
    end if;
  end loop;
  return jsonb_build_object('client_24h',clients24,'client_48h',clients48,'recruiter_72h',escalations,'overdue_5d',overdue);
end;
$$;

revoke execute on function public.refresh_match_suggestions_for_va(uuid) from public,anon,authenticated;
revoke execute on function public.refresh_all_match_suggestions() from public,anon,authenticated;
revoke execute on function public.recruiter_candidate_intelligence(uuid) from public,anon,authenticated;
revoke execute on function public.recruiter_talent_health() from public,anon,authenticated;
revoke execute on function public.recruiter_client_followup_sweep() from public,anon,authenticated;
grant execute on function public.refresh_match_suggestions_for_va(uuid) to service_role;
grant execute on function public.refresh_all_match_suggestions() to service_role;
grant execute on function public.recruiter_candidate_intelligence(uuid) to service_role;
grant execute on function public.recruiter_talent_health() to service_role;
grant execute on function public.recruiter_client_followup_sweep() to service_role;

select cron.schedule('recruiter-client-followups-hourly','17 * * * *',$$select public.recruiter_client_followup_sweep();$$)
where not exists(select 1 from cron.job where jobname='recruiter-client-followups-hourly');
