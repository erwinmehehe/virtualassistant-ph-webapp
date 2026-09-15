-- Complete the managed-placement operating loop with first-class support requests
-- and recruiter-verifiable VA work readiness. All request rows stay server-only;
-- clients and VAs interact through authorized server actions.

alter table public.va_profiles add column if not exists work_setup_submitted_at timestamptz;
alter table public.va_profiles add column if not exists work_setup_verified_by uuid references public.profiles(id) on delete set null;
alter table public.va_profiles add column if not exists work_setup_verification_notes text;

create table if not exists public.placement_support_requests (
  id uuid primary key default gen_random_uuid(),
  workroom_id uuid not null references public.workrooms(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  requester_role text not null check (requester_role in ('client','va')),
  request_type text not null check (request_type in ('leave','sick','emergency','late','schedule_change','concern','replacement')),
  priority text not null default 'normal' check (priority in ('normal','high','urgent')),
  details text not null check (char_length(details) between 5 and 4000),
  start_date date,
  end_date date,
  status text not null default 'open' check (status in ('open','acknowledged','resolved','declined')),
  resolution text check (resolution is null or char_length(resolution) <= 4000),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint placement_support_date_order check (end_date is null or start_date is null or end_date >= start_date)
);

alter table public.placement_support_requests enable row level security;
revoke all on table public.placement_support_requests from public, anon, authenticated;
grant select, insert, update, delete on table public.placement_support_requests to service_role;

create index if not exists placement_support_workroom_idx
  on public.placement_support_requests(workroom_id, status, created_at desc);
create index if not exists placement_support_open_idx
  on public.placement_support_requests(status, priority, created_at)
  where status in ('open','acknowledged');

create or replace function public.touch_placement_support_request()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.touch_placement_support_request() from public, anon, authenticated;

drop trigger if exists placement_support_touch on public.placement_support_requests;
create trigger placement_support_touch
before update on public.placement_support_requests
for each row execute function public.touch_placement_support_request();

-- Placement Health remains deterministic. Support and attendance only contribute
-- when there is an active signal; the absence of a request is never treated as
-- proof that a placement is healthy.
create or replace function public.recompute_placement_health(p_workroom_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
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
  v_attendance_score numeric;
  v_support_score numeric;
  v_task_total integer;
  v_task_done integer;
  v_time_total integer;
  v_time_points numeric;
  v_rating integer;
  v_weight integer := 0;
  v_weighted numeric := 0;
  v_score integer;
  v_status text := 'building';
begin
  select * into r from public.workrooms where id = p_workroom_id;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;

  select * into s from public.admin_settings where id = 1;

  select client_signal into v_client_signal
  from public.placement_checkins
  where workroom_id = p_workroom_id and client_signal is not null
  order by coalesce(client_responded_at, completed_at, due_at) desc limit 1;
  if v_client_signal is not null then
    v_client_score := case v_client_signal when 'green' then 100 when 'yellow' then 65 else 20 end;
    v_weight := v_weight + coalesce(s.health_client_sentiment_weight, 25);
    v_weighted := v_weighted + v_client_score * coalesce(s.health_client_sentiment_weight, 25);
  end if;

  select va_signal into v_va_signal
  from public.placement_checkins
  where workroom_id = p_workroom_id and va_signal is not null
  order by coalesce(va_responded_at, completed_at, due_at) desc limit 1;
  if v_va_signal is not null then
    v_va_score := case v_va_signal when 'green' then 100 when 'yellow' then 65 else 20 end;
    v_weight := v_weight + coalesce(s.health_va_sentiment_weight, 15);
    v_weighted := v_weighted + v_va_score * coalesce(s.health_va_sentiment_weight, 15);
  end if;

  select count(*), count(*) filter(where status = 'done') into v_task_total, v_task_done
  from public.workroom_tasks
  where workroom_id = p_workroom_id and due_date is not null and due_date <= current_date;
  if v_task_total > 0 then
    v_task_score := round((v_task_done::numeric / v_task_total::numeric) * 100, 2);
    v_weight := v_weight + coalesce(s.health_task_completion_weight, 10);
    v_weighted := v_weighted + v_task_score * coalesce(s.health_task_completion_weight, 10);
  end if;

  select count(*), coalesce(sum(case status when 'approved' then 100 when 'pending' then 75 when 'changes_requested' then 20 else 50 end), 0)
    into v_time_total, v_time_points
  from public.time_entries
  where workroom_id = p_workroom_id and work_date >= current_date - 30;
  if v_time_total > 0 then
    v_timesheet_score := round(v_time_points / v_time_total, 2);
    v_weight := v_weight + coalesce(s.health_timesheet_weight, 5);
    v_weighted := v_weighted + v_timesheet_score * coalesce(s.health_timesheet_weight, 5);
  end if;

  select rating into v_rating
  from public.reviews
  where workroom_id = p_workroom_id and reviewer_id = r.client_id
  order by updated_at desc limit 1;
  if v_rating is not null then
    v_performance_score := greatest(0, least(100, (v_rating::numeric / 5) * 100));
    v_weight := v_weight + coalesce(s.health_performance_weight, 15);
    v_weighted := v_weighted + v_performance_score * coalesce(s.health_performance_weight, 15);
  end if;

  select min(case request_type
    when 'emergency' then 20
    when 'sick' then 55
    when 'late' then 60
    when 'leave' then 75
    when 'schedule_change' then 75
    else null end)
  into v_attendance_score
  from public.placement_support_requests
  where workroom_id = p_workroom_id
    and status in ('open','acknowledged')
    and request_type in ('leave','sick','emergency','late','schedule_change')
    and created_at >= now() - interval '30 days';
  if v_attendance_score is not null then
    v_weight := v_weight + coalesce(s.health_attendance_weight, 15);
    v_weighted := v_weighted + v_attendance_score * coalesce(s.health_attendance_weight, 15);
  end if;

  select min(case request_type when 'replacement' then 10 when 'concern' then 45 else null end)
  into v_support_score
  from public.placement_support_requests
  where workroom_id = p_workroom_id
    and status in ('open','acknowledged')
    and request_type in ('concern','replacement');
  if v_support_score is not null then
    v_weight := v_weight + coalesce(s.health_support_weight, 5);
    v_weighted := v_weighted + v_support_score * coalesce(s.health_support_weight, 5);
  end if;

  if v_weight >= coalesce(s.health_min_coverage, 40) then
    v_score := greatest(0, least(100, round(v_weighted / v_weight)::integer));
    if v_score >= coalesce(s.health_healthy_threshold, 85) then v_status := 'healthy';
    elsif v_score >= coalesce(s.health_watch_threshold, 65) then v_status := 'watch';
    else v_status := 'at_risk';
    end if;
  else
    v_score := null;
    v_status := 'building';
  end if;

  update public.workrooms set
    health_score = v_score,
    health_status = v_status,
    health_coverage = least(v_weight, 100),
    health_calculated_at = now()
  where id = p_workroom_id;

  return jsonb_build_object(
    'ok', true,
    'score', v_score,
    'status', v_status,
    'coverage', least(v_weight, 100),
    'client_signal', v_client_signal,
    'va_signal', v_va_signal,
    'attendance_signal', v_attendance_score,
    'support_signal', v_support_score
  );
end;
$$;

revoke execute on function public.recompute_placement_health(uuid) from public, anon, authenticated;
grant execute on function public.recompute_placement_health(uuid) to service_role;

drop trigger if exists placement_support_health_sync on public.placement_support_requests;
create trigger placement_support_health_sync
after insert or update or delete on public.placement_support_requests
for each row execute function public.recompute_placement_health_trigger();
