-- Closed roles must stay closed even when they retain historical shortlist,
-- interview, or offer records. A completed placement still wins as "filled".
-- Draft roles also stay in intake rather than advancing merely because a
-- client account is already linked.

create or replace function public.sync_job_hiring_stage(p_job_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_stage text;
  v_status public.job_status;
  v_client uuid;
begin
  select status, client_id
  into v_status, v_client
  from public.jobs
  where id = p_job_id;

  if not found then
    return null;
  end if;

  if exists (
    select 1
    from public.workrooms
    where job_id = p_job_id
      and status in ('active','paused','completed')
  ) then
    v_stage := 'filled';
  elsif v_status = 'closed' then
    v_stage := 'closed';
  elsif v_status = 'draft' then
    v_stage := 'intake';
  elsif exists (
    select 1
    from public.placement_offers
    where job_id = p_job_id
      and status = 'accepted'
  ) then
    v_stage := 'pre_start';
  elsif exists (
    select 1
    from public.placement_offers
    where job_id = p_job_id
      and status in ('pending_va','pending_client')
  ) then
    v_stage := 'offer';
  elsif exists (
    select 1
    from public.candidate_interviews
    where job_id = p_job_id
      and status = 'completed'
      and client_decision = 'proceed'
  ) then
    v_stage := 'selected';
  elsif exists (
    select 1
    from public.candidate_interviews
    where job_id = p_job_id
      and status in ('requested','scheduled')
  ) or exists (
    select 1
    from public.candidate_interviews
    where job_id = p_job_id
      and status = 'completed'
      and client_decision = 'hold'
  ) then
    v_stage := 'interviewing';
  elsif exists (
    select 1
    from public.job_shortlist_candidates
    where job_id = p_job_id
      and shortlist_status = 'released'
  ) and not exists (
    select 1
    from public.job_shortlist_candidates
    where job_id = p_job_id
      and shortlist_status = 'released'
      and coalesce(client_decision, '') <> 'pass'
  ) then
    v_stage := 'sourcing';
  elsif exists (
    select 1
    from public.job_shortlist_candidates
    where job_id = p_job_id
      and shortlist_status = 'released'
  ) then
    v_stage := 'client_review';
  elsif exists (
    select 1
    from public.job_shortlist_candidates
    where job_id = p_job_id
      and shortlist_status = 'proposed'
      and created_by is not null
  ) then
    v_stage := 'internal_review';
  elsif v_status = 'published' then
    v_stage := 'sourcing';
  elsif v_status = 'pending' and v_client is not null then
    v_stage := 'ready_to_recruit';
  else
    v_stage := 'intake';
  end if;

  update public.jobs
  set hiring_stage = v_stage
  where id = p_job_id
    and hiring_stage is distinct from v_stage;

  return v_stage;
end;
$function$;

do $$
declare
  r record;
begin
  for r in select id from public.jobs
  loop
    perform public.sync_job_hiring_stage(r.id);
  end loop;
end $$;
