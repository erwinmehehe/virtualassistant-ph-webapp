create or replace function public.recruiter_dashboard_metrics(p_signup_weeks integer default 10)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      (date_trunc('week', now() at time zone 'UTC') at time zone 'UTC') as current_week,
      greatest(p_signup_weeks, 1) as weeks
  ),
  directory as materialized (
    select account_status, stage, completion_score, account_created_at
    from public.recruiter_va_directory
  ),
  funnel as (
    select
      count(*) filter (where account_status = 'active' and stage <> 'rejected')::int as total,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score > 0)::int as started,
      count(*) filter (where account_status = 'active' and stage in ('approved', 'bench'))::int as approved
    from directory
  ),
  public_count as (
    select count(*)::int as public
    from public.public_va_directory
  ),
  weekly as (
    select
      gs.week_start,
      count(d.account_created_at)::int as signup_count
    from params p
    cross join lateral generate_series(
      p.current_week - ((p.weeks - 1) * interval '1 week'),
      p.current_week,
      interval '1 week'
    ) as gs(week_start)
    left join directory d
      on d.account_created_at >= gs.week_start
     and d.account_created_at < gs.week_start + interval '1 week'
    group by gs.week_start
    order by gs.week_start
  )
  select jsonb_build_object(
    'total', f.total,
    'started', f.started,
    'approved', f.approved,
    'public', p.public,
    'signups', coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('week_start', week_start, 'count', signup_count)
          order by week_start
        )
        from weekly
      ),
      '[]'::jsonb
    )
  )
  from funnel f
  cross join public_count p;
$$;

revoke all on function public.recruiter_dashboard_metrics(integer) from public;
revoke all on function public.recruiter_dashboard_metrics(integer) from anon;
revoke all on function public.recruiter_dashboard_metrics(integer) from authenticated;
grant execute on function public.recruiter_dashboard_metrics(integer) to service_role;
