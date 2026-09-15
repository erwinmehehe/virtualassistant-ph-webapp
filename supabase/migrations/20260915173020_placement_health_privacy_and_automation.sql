-- Deterministic placement health, Client Success automation, public-company
-- privacy, and VA availability freshness.

alter table public.va_profiles add column if not exists availability_last_prompted_at timestamptz;

-- Existing recent profile activity can count as the first freshness checkpoint;
-- older profiles remain stale until the VA confirms again.
update public.va_profiles
set availability_confirmed_at=updated_at
where availability_confirmed_at is null
  and updated_at >= now()-interval '14 days';

-- Public company identity is explicit opt-in. A company can have a complete
-- private profile without appearing on public job pages.
create or replace function private.public_company_profile_rows()
returns table(
  user_id uuid,
  company_name text,
  logo_url text,
  website text,
  industry text,
  location text,
  team_size text,
  company_description text,
  verified_at timestamptz,
  hires_count integer
)
language sql
stable
security definer
set search_path='pg_catalog'
as $$
  select
    c.user_id,
    c.company_name,
    c.logo_url,
    c.website,
    c.industry,
    c.location,
    c.team_size,
    c.company_description,
    c.verified_at,
    (select count(*)::integer from public.workrooms w where w.client_id=c.user_id) as hires_count
  from public.client_profiles c
  where c.public_company_visible=true
    and c.company_name is not null
    and btrim(c.company_name)<>'';
$$;

create or replace view public.public_company_profiles as
select * from private.public_company_profile_rows();
revoke all on public.public_company_profiles from anon;
grant select on public.public_company_profiles to anon,authenticated;

-- Human-readable labels stay in code. This function only calculates a score
-- from structured facts. Missing signals increase coverage only when evidence
-- actually exists, so the system never pretends an unmeasured placement is
-- healthy.
create or replace function public.recompute_placement_health(p_workroom_id uuid)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  r record;
  s record;
  v_client_signal text;
  v_va_signal text;
  v_client_score numeric;
  v_va_score numeric;
  v_task_score numeric;
  v_timesheet_score numeric;
  v_performance_score numeric;
  v_task_total integer;
  v_task_done integer;
  v_time_total integer;
  v_time_points numeric;
  v_rating integer;
  v_weight integer:=0;
  v_weighted numeric:=0;
  v_score integer;
  v_status text:='building';
begin
  select * into r from workrooms where id=p_workroom_id;
  if not found then return jsonb_build_object('ok',false,'reason','not_found'); end if;

  select * into s from admin_settings where id=1;

  select client_signal into v_client_signal
  from placement_checkins
  where workroom_id=p_workroom_id and client_signal is not null
  order by coalesce(client_responded_at,completed_at,due_at) desc limit 1;
  if v_client_signal is not null then
    v_client_score:=case v_client_signal when 'green' then 100 when 'yellow' then 65 else 20 end;
    v_weight:=v_weight+coalesce(s.health_client_sentiment_weight,25);
    v_weighted:=v_weighted+v_client_score*coalesce(s.health_client_sentiment_weight,25);
  end if;

  select va_signal into v_va_signal
  from placement_checkins
  where workroom_id=p_workroom_id and va_signal is not null
  order by coalesce(va_responded_at,completed_at,due_at) desc limit 1;
  if v_va_signal is not null then
    v_va_score:=case v_va_signal when 'green' then 100 when 'yellow' then 65 else 20 end;
    v_weight:=v_weight+coalesce(s.health_va_sentiment_weight,15);
    v_weighted:=v_weighted+v_va_score*coalesce(s.health_va_sentiment_weight,15);
  end if;

  select count(*),count(*) filter(where status='done') into v_task_total,v_task_done
  from workroom_tasks
  where workroom_id=p_workroom_id and due_date is not null and due_date<=current_date;
  if v_task_total>0 then
    v_task_score:=round((v_task_done::numeric/v_task_total::numeric)*100,2);
    v_weight:=v_weight+coalesce(s.health_task_completion_weight,10);
    v_weighted:=v_weighted+v_task_score*coalesce(s.health_task_completion_weight,10);
  end if;

  select count(*),coalesce(sum(case status when 'approved' then 100 when 'pending' then 75 when 'changes_requested' then 20 else 50 end),0)
    into v_time_total,v_time_points
  from time_entries
  where workroom_id=p_workroom_id and work_date>=current_date-30;
  if v_time_total>0 then
    v_timesheet_score:=round(v_time_points/v_time_total,2);
    v_weight:=v_weight+coalesce(s.health_timesheet_weight,5);
    v_weighted:=v_weighted+v_timesheet_score*coalesce(s.health_timesheet_weight,5);
  end if;

  select rating into v_rating
  from reviews
  where workroom_id=p_workroom_id and reviewer_id=r.client_id
  order by updated_at desc limit 1;
  if v_rating is not null then
    v_performance_score:=greatest(0,least(100,(v_rating::numeric/5)*100));
    v_weight:=v_weight+coalesce(s.health_performance_weight,15);
    v_weighted:=v_weighted+v_performance_score*coalesce(s.health_performance_weight,15);
  end if;

  if v_weight>=coalesce(s.health_min_coverage,40) then
    v_score:=greatest(0,least(100,round(v_weighted/v_weight)::integer));
    if v_score>=coalesce(s.health_healthy_threshold,85) then v_status:='healthy';
    elsif v_score>=coalesce(s.health_watch_threshold,65) then v_status:='watch';
    else v_status:='at_risk';
    end if;
  else
    v_score:=null;
    v_status:='building';
  end if;

  update workrooms set
    health_score=v_score,
    health_status=v_status,
    health_coverage=least(v_weight,100),
    health_calculated_at=now()
  where id=p_workroom_id;

  return jsonb_build_object(
    'ok',true,
    'score',v_score,
    'status',v_status,
    'coverage',least(v_weight,100),
    'client_signal',v_client_signal,
    'va_signal',v_va_signal
  );
end;
$$;

create or replace function public.recompute_placement_health_trigger()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid; begin
  if tg_table_name='workrooms' then
    v_id:=new.id;
  elsif tg_op='DELETE' then
    v_id:=old.workroom_id;
  else
    v_id:=new.workroom_id;
  end if;
  perform recompute_placement_health(v_id);
  return null;
end;
$$;

drop trigger if exists placement_checkin_health_sync on public.placement_checkins;
create trigger placement_checkin_health_sync after insert or update or delete on public.placement_checkins
for each row execute function public.recompute_placement_health_trigger();
drop trigger if exists workroom_task_health_sync on public.workroom_tasks;
create trigger workroom_task_health_sync after insert or update or delete on public.workroom_tasks
for each row execute function public.recompute_placement_health_trigger();
drop trigger if exists time_entry_health_sync on public.time_entries;
create trigger time_entry_health_sync after insert or update or delete on public.time_entries
for each row execute function public.recompute_placement_health_trigger();
drop trigger if exists placement_review_health_sync on public.reviews;
create trigger placement_review_health_sync after insert or update or delete on public.reviews
for each row execute function public.recompute_placement_health_trigger();

-- Client/VA pulse responses complete independently. When both are present the
-- milestone closes automatically. Yellow/red signals are escalated by the
-- scheduled sweep below.
create or replace function public.sync_placement_checkin_status()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.client_signal is not null and new.va_signal is not null then
    new.status:='completed';
    new.completed_at:=coalesce(new.completed_at,now());
  elsif new.status='completed' and (new.client_signal is null or new.va_signal is null) then
    new.status:='todo';
    new.completed_at:=null;
  end if;
  new.updated_at:=now();
  return new;
end;
$$;
drop trigger if exists placement_checkin_status_sync on public.placement_checkins;
create trigger placement_checkin_status_sync
before insert or update of client_signal,va_signal,status on public.placement_checkins
for each row execute function public.sync_placement_checkin_status();

-- Weekly VA availability freshness. The prompt is automated; the VA confirms
-- their own schedule/rate. No recruiter marks availability on their behalf.
create or replace function public.va_availability_freshness_sweep()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare r record; prompted integer:=0; begin
  for r in
    select v.user_id,v.weekly_hours,v.schedule,v.hourly_rate,v.availability_confirmed_at,v.availability_last_prompted_at
    from va_profiles v
    join profiles p on p.id=v.user_id
    where v.availability_status='available'
      and p.account_status='active'
      and (v.availability_confirmed_at is null or v.availability_confirmed_at<now()-interval '7 days')
      and (v.availability_last_prompted_at is null or v.availability_last_prompted_at<now()-interval '7 days')
  loop
    insert into notifications(user_id,title,body,href,type,priority) values(
      r.user_id,
      'Please confirm your availability',
      'Confirm that your weekly hours, schedule and current rate are still accurate so recruiters can present you with confidence.',
      '/workspace/va/profile#availability',
      'availability',
      case when r.availability_confirmed_at is null or r.availability_confirmed_at<now()-interval '14 days' then 'high' else 'normal' end
    );
    update va_profiles set availability_last_prompted_at=now() where user_id=r.user_id;
    prompted:=prompted+1;
  end loop;
  return jsonb_build_object('prompted',prompted);
end;
$$;

-- Once freshness is more than 14 days old, do not release the candidate to a
-- client until the VA confirms again. Proposed recruiter-only suggestions are
-- still allowed.
create or replace function public.guard_released_candidate_availability()
returns trigger
language plpgsql
set search_path=public
as $$
declare v record; begin
  if new.shortlist_status='released' and (tg_op='INSERT' or old.shortlist_status is distinct from new.shortlist_status) then
    select availability_status,availability_confirmed_at into v from va_profiles where user_id=new.va_id;
    if v.availability_status is distinct from 'available'
       or v.availability_confirmed_at is null
       or v.availability_confirmed_at<now()-interval '14 days' then
      raise exception 'VA availability is stale. Ask the VA to confirm their availability before client presentation.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists shortlist_release_availability_guard on public.job_shortlist_candidates;
create trigger shortlist_release_availability_guard
before insert or update of shortlist_status on public.job_shortlist_candidates
for each row execute function public.guard_released_candidate_availability();

-- Hourly Client Success automation. It sends milestone pulses, escalates only
-- real concerns, advances launch lifecycle, and creates ongoing monthly pulses
-- after Day 90. Healthy accounts should not generate unnecessary manual work.
create or replace function public.placement_client_success_sweep()
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  r record;
  client_prompts integer:=0;
  va_prompts integer:=0;
  escalations integer:=0;
  monthly_created integer:=0;
  lifecycle_updates integer:=0;
  v_month integer;
  v_checkpoint text;
  v_due timestamptz;
begin
  update workrooms
  set placement_stage='launch',placement_stage_entered_at=now()
  where placement_stage='pre_start' and coalesce(start_date,current_date)<=current_date;
  get diagnostics lifecycle_updates=row_count;

  update workrooms
  set placement_stage='active',placement_stage_entered_at=now()
  where placement_stage='launch' and coalesce(start_date,current_date)<=current_date-7;
  get diagnostics lifecycle_updates=lifecycle_updates+row_count;

  -- Build the next monthly pulse after Day 90 without pre-creating years of rows.
  for r in
    select id,start_date,created_at
    from workrooms
    where placement_stage in ('active','recovery')
      and coalesce(start_date,created_at::date)<=current_date-90
  loop
    v_month:=greatest(4,floor((current_date-coalesce(r.start_date,r.created_at::date))/30.0)::integer+1);
    v_checkpoint:='month'||v_month::text;
    v_due:=coalesce(r.start_date::timestamp at time zone 'Asia/Manila',r.created_at)+(v_month*30||' days')::interval;
    if v_due<=now()+interval '35 days' then
      insert into placement_checkins(workroom_id,checkpoint,due_at)
      values(r.id,v_checkpoint,v_due)
      on conflict(workroom_id,checkpoint) do nothing;
      if found then monthly_created:=monthly_created+1; end if;
    end if;
  end loop;

  for r in
    select c.*,w.client_id,w.va_id,w.client_success_owner_id,j.title
    from placement_checkins c
    join workrooms w on w.id=c.workroom_id
    join jobs j on j.id=w.job_id
    where w.placement_stage<>'ended'
  loop
    if r.client_signal is null and r.client_notified_at is null and r.due_at<=now()+interval '24 hours' then
      insert into notifications(user_id,title,body,href,type,priority) values(
        r.client_id,
        'Quick placement check-in: '||r.title,
        'How is the placement going? A one-click pulse helps Client Success step in only when you need support.',
        '/workspace/client/team?checkin='||r.id::text,
        'placement_checkin','normal'
      );
      update placement_checkins set client_notified_at=now(),updated_at=now() where id=r.id;
      client_prompts:=client_prompts+1;
    end if;

    if r.va_signal is null and r.va_notified_at is null and r.due_at<=now()+interval '24 hours' then
      insert into notifications(user_id,title,body,href,type,priority) values(
        r.va_id,
        'Quick placement check-in: '||r.title,
        'How is the placement going? Share a quick pulse so Client Success can help early if something is getting in the way.',
        '/workspace/va/workroom?checkin='||r.id::text,
        'placement_checkin','normal'
      );
      update placement_checkins set va_notified_at=now(),updated_at=now() where id=r.id;
      va_prompts:=va_prompts+1;
    end if;

    if r.client_success_owner_id is not null and r.escalated_at is null
       and (r.client_signal in ('yellow','red') or r.va_signal in ('yellow','red')) then
      insert into notifications(user_id,title,body,href,type,priority) values(
        r.client_success_owner_id,
        case when r.client_signal='red' or r.va_signal='red' then 'Placement needs attention: ' else 'Placement check-in needs review: ' end||r.title,
        case
          when r.client_signal='red' or r.va_signal='red' then 'A client or VA reported a serious concern. Review the placement today.'
          else 'A client or VA reported a concern. Review the context and decide whether follow-up is needed.'
        end,
        '/workspace/client-success/'||r.workroom_id::text,
        'placement_risk',
        case when r.client_signal='red' or r.va_signal='red' then 'urgent' else 'high' end
      );
      update placement_checkins set escalated_at=now(),updated_at=now() where id=r.id;
      escalations:=escalations+1;
    end if;
  end loop;

  -- Recalculate all live placements after automation. This stays deterministic.
  for r in select id from workrooms where placement_stage<>'ended' loop
    perform recompute_placement_health(r.id);
  end loop;

  return jsonb_build_object(
    'client_prompts',client_prompts,
    'va_prompts',va_prompts,
    'escalations',escalations,
    'monthly_created',monthly_created,
    'lifecycle_updates',lifecycle_updates
  );
end;
$$;

revoke execute on function public.recompute_placement_health(uuid) from public,anon,authenticated;
revoke execute on function public.recompute_placement_health_trigger() from public,anon,authenticated;
revoke execute on function public.sync_placement_checkin_status() from public,anon,authenticated;
revoke execute on function public.va_availability_freshness_sweep() from public,anon,authenticated;
revoke execute on function public.guard_released_candidate_availability() from public,anon,authenticated;
revoke execute on function public.placement_client_success_sweep() from public,anon,authenticated;
grant execute on function public.recompute_placement_health(uuid) to service_role;
grant execute on function public.va_availability_freshness_sweep() to service_role;
grant execute on function public.placement_client_success_sweep() to service_role;

select cron.schedule('va-availability-freshness-daily','23 8 * * *',$$select public.va_availability_freshness_sweep();$$)
where not exists(select 1 from cron.job where jobname='va-availability-freshness-daily');
select cron.schedule('placement-client-success-hourly','19 * * * *',$$select public.placement_client_success_sweep();$$)
where not exists(select 1 from cron.job where jobname='placement-client-success-hourly');

-- Calculate an initial honest health state. Placements with too little evidence
-- remain Building instead of receiving a made-up score.
select recompute_placement_health(id) from workrooms where status<>'completed';
