create index if not exists lead_intake_client_created_owner_idx
  on public.lead_intake (client_id, created_at desc)
  where owner_id is not null;

create or replace function public.recruiter_dashboard_overview(p_queue_limit integer default 5)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with directory as materialized (
    select account_status, stage, completion_score, avatar_url
    from public.recruiter_va_directory
  ),
  directory_metrics as (
    select
      count(*) filter (where account_status = 'active' and stage <> 'rejected')::int as total,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score > 0)::int as started,
      count(*) filter (where account_status = 'active' and stage in ('approved', 'bench'))::int as approved,
      count(*) filter (where account_status = 'active' and stage <> 'rejected' and completion_score < 100)::int as incomplete,
      count(*) filter (
        where account_status = 'active'
          and completion_score >= 80
          and avatar_url is not null
          and stage not in ('approved', 'bench', 'rejected')
      )::int as ready,
      count(*) filter (
        where account_status = 'active'
          and stage in ('approved', 'bench')
          and completion_score < 100
      )::int as vetted_hidden
    from directory
  ),
  public_count as (
    select count(*)::int as public
    from public.public_va_directory
  ),
  recruiter_counts as (
    select count(*) filter (where stage = 'recruiter_review')::int as unreviewed
    from public.va_vetting
  ),
  job_metrics as (
    select
      count(*) filter (where j.status in ('pending', 'published'))::int as active_jobs,
      count(*) filter (where j.status = 'pending')::int as pending_jobs,
      count(*) filter (
        where j.status in ('pending', 'published')
          and not exists (select 1 from public.applications a where a.job_id = j.id)
          and not exists (
            select 1
            from public.job_shortlist_candidates s
            where s.job_id = j.id
              and s.shortlist_status in ('proposed', 'released')
          )
      )::int as roles_without_candidates
    from public.jobs j
  ),
  marketplace_metrics as (
    select
      (select count(*)::int from public.applications where status = 'new') as new_apps,
      (select count(*)::int from public.messages where read_at is null) as unread_messages,
      (select count(*)::int from public.job_shortlist_candidates where shortlist_status = 'released') as released_shortlists
  ),
  lead_metrics as (
    select
      count(*)::int as open_leads,
      count(*) filter (where coalesce(crm_stage, 'new') = 'new' and first_contact_at is null)::int as untouched_leads,
      count(*) filter (where next_follow_up_at is not null and next_follow_up_at <= now())::int as followups_due,
      coalesce(sum(estimated_value_usd), 0)::numeric as open_pipeline_value,
      count(*) filter (
        where discovery_scheduled_at is not null
          and discovery_completed_at is null
          and discovery_scheduled_at >= now() - interval '1 hour'
          and discovery_scheduled_at < ((date_trunc('day', now() at time zone 'Asia/Manila') + interval '2 days') at time zone 'Asia/Manila')
      )::int as discovery_next_two_days
    from public.lead_intake
    where coalesce(crm_stage, 'new') not in ('won', 'lost')
  ),
  vetting_queue as (
    select coalesce(jsonb_agg(to_jsonb(q) order by q.updated_at), '[]'::jsonb) as rows
    from (
      select
        vv.va_id,
        vv.updated_at,
        vv.video_url,
        p.full_name,
        p.avatar_url,
        v.headline,
        v.bio,
        v.primary_category,
        v.skills,
        v.tools,
        v.years_experience,
        v.weekly_hours,
        v.hourly_rate,
        v.resume_path,
        v.portfolio_url,
        latest.test_score
      from public.va_vetting vv
      left join public.profiles p on p.id = vv.va_id
      left join public.va_profiles v on v.user_id = vv.va_id
      left join lateral (
        select coalesce(t.final_score, t.auto_score) as test_score
        from public.va_test_attempts t
        where t.va_id = vv.va_id
        order by t.submitted_at desc
        limit 1
      ) latest on true
      where vv.stage = 'recruiter_review'
      order by vv.updated_at
      limit greatest(p_queue_limit, 1)
    ) q
  ),
  roles_needing_matching as (
    select coalesce(jsonb_agg(to_jsonb(j) order by j.created_at desc), '[]'::jsonb) as rows
    from (
      select id, title, company_name, status, created_at
      from public.jobs j
      where j.status in ('pending', 'published')
        and not exists (select 1 from public.applications a where a.job_id = j.id)
        and not exists (
          select 1
          from public.job_shortlist_candidates s
          where s.job_id = j.id
            and s.shortlist_status in ('proposed', 'released')
        )
      order by j.created_at desc
      limit greatest(p_queue_limit, 1)
    ) j
  )
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'total', d.total,
      'started', d.started,
      'approved', d.approved,
      'public', p.public,
      'incomplete', d.incomplete,
      'ready', d.ready,
      'vetted_hidden', d.vetted_hidden,
      'unreviewed', r.unreviewed,
      'active_jobs', j.active_jobs,
      'pending_jobs', j.pending_jobs,
      'roles_without_candidates', j.roles_without_candidates,
      'new_apps', m.new_apps,
      'unread_messages', m.unread_messages,
      'released_shortlists', m.released_shortlists,
      'open_leads', l.open_leads,
      'untouched_leads', l.untouched_leads,
      'followups_due', l.followups_due,
      'open_pipeline_value', l.open_pipeline_value,
      'discovery_next_two_days', l.discovery_next_two_days
    ),
    'vetting_queue', vq.rows,
    'roles_needing_matching', rm.rows
  )
  from directory_metrics d
  cross join public_count p
  cross join recruiter_counts r
  cross join job_metrics j
  cross join marketplace_metrics m
  cross join lead_metrics l
  cross join vetting_queue vq
  cross join roles_needing_matching rm;
$$;

revoke all on function public.recruiter_dashboard_overview(integer) from public;
revoke all on function public.recruiter_dashboard_overview(integer) from anon;
revoke all on function public.recruiter_dashboard_overview(integer) from authenticated;
grant execute on function public.recruiter_dashboard_overview(integer) to service_role;

create or replace function public.recruiter_dashboard_signups(p_signup_weeks integer default 10)
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
    left join public.recruiter_va_directory d
      on d.account_created_at >= gs.week_start
     and d.account_created_at < gs.week_start + interval '1 week'
    group by gs.week_start
    order by gs.week_start
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object('week_start', week_start, 'count', signup_count)
      order by week_start
    ),
    '[]'::jsonb
  )
  from weekly;
$$;

revoke all on function public.recruiter_dashboard_signups(integer) from public;
revoke all on function public.recruiter_dashboard_signups(integer) from anon;
revoke all on function public.recruiter_dashboard_signups(integer) from authenticated;
grant execute on function public.recruiter_dashboard_signups(integer) to service_role;

create or replace function public.client_dashboard_summary(p_client_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with client_jobs as materialized (
    select id, title, status, created_at, published_at
    from public.jobs
    where client_id = p_client_id
  ),
  company as (
    select jsonb_build_object(
      'company_name', company_name,
      'timezone', timezone,
      'onboarding_completed_at', onboarding_completed_at
    ) as data
    from public.client_profiles
    where user_id = p_client_id
  ),
  hiring_owner as (
    select jsonb_build_object('id', p.id, 'full_name', p.full_name) as data
    from public.lead_intake l
    join public.profiles p on p.id = l.owner_id
    where l.client_id = p_client_id
      and l.owner_id is not null
    order by l.created_at desc
    limit 1
  ),
  app_metrics as (
    select
      count(*)::int as application_count,
      count(*) filter (where a.status in ('new', 'reviewing'))::int as applied,
      count(*) filter (where a.status = 'shortlisted')::int as shortlisted,
      count(*) filter (where a.status = 'interview')::int as interview,
      count(*) filter (where a.status = 'offered')::int as offered,
      count(*) filter (where a.status = 'hired')::int as hired,
      count(*) filter (where a.status = 'rejected')::int as rejected
    from public.applications a
    join client_jobs j on j.id = a.job_id
  ),
  recent_jobs as (
    select
      j.id,
      j.title,
      j.status,
      j.created_at,
      j.published_at,
      count(a.id)::int as applicants,
      count(a.id) filter (where a.status = 'shortlisted')::int as shortlisted,
      count(a.id) filter (where a.status = 'interview')::int as interview,
      count(a.id) filter (where a.status = 'offered')::int as offered,
      count(a.id) filter (where a.status = 'hired')::int as hired
    from client_jobs j
    left join public.applications a on a.job_id = j.id
    group by j.id, j.title, j.status, j.created_at, j.published_at
    order by j.created_at desc
    limit 6
  ),
  unread as (
    select count(*)::int as messages
    from public.messages m
    join public.conversations c on c.id = m.conversation_id
    where c.client_id = p_client_id
      and m.sender_id <> p_client_id
      and m.read_at is null
  )
  select jsonb_build_object(
    'company', coalesce((select data from company), '{}'::jsonb),
    'hiring_owner', coalesce((select data from hiring_owner), '{}'::jsonb),
    'job_count', (select count(*)::int from client_jobs),
    'active_jobs', (select count(*)::int from client_jobs where status = 'published'),
    'hire_count', (select count(*)::int from public.workrooms where client_id = p_client_id),
    'application_count', a.application_count,
    'unread_messages', u.messages,
    'pipeline', jsonb_build_object(
      'applied', a.applied,
      'shortlisted', a.shortlisted,
      'interview', a.interview,
      'offered', a.offered,
      'hired', a.hired,
      'rejected', a.rejected
    ),
    'jobs', coalesce((select jsonb_agg(to_jsonb(r) order by r.created_at desc) from recent_jobs r), '[]'::jsonb)
  )
  from app_metrics a
  cross join unread u;
$$;

revoke all on function public.client_dashboard_summary(uuid) from public;
revoke all on function public.client_dashboard_summary(uuid) from anon;
revoke all on function public.client_dashboard_summary(uuid) from authenticated;
grant execute on function public.client_dashboard_summary(uuid) to service_role;

create or replace function public.recruiter_leads_page(
  p_view text default 'recent',
  p_query text default null,
  p_owner_id uuid default null,
  p_page integer default 1,
  p_page_size integer default 25
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with params as (
    select
      case
        when lower(coalesce(nullif(btrim(p_view), ''), 'recent')) in ('recent','attention','open','discovery','qualified','nurture','won','lost','all')
          then lower(coalesce(nullif(btrim(p_view), ''), 'recent'))
        else 'recent'
      end as view_name,
      nullif(btrim(p_query), '') as search_query,
      greatest(coalesce(p_page, 1), 1) as page_number,
      least(greatest(coalesce(p_page_size, 25), 1), 50) as page_size
  ),
  filtered as materialized (
    select
      l.*,
      case
        when coalesce(l.crm_stage, 'new') = 'new'
          and l.first_contact_at is null
          and l.created_at < now() - interval '30 minutes' then 0
        when l.next_follow_up_at is not null
          and l.next_follow_up_at < now()
          and coalesce(l.crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') then 1
        when coalesce(l.crm_stage, 'new') = 'new' then 2
        when l.next_follow_up_at is not null
          and l.next_follow_up_at <= now() + interval '24 hours'
          and coalesce(l.crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') then 3
        else 4
      end as priority
    from public.lead_intake l
    cross join params p
    where
      (
        p.view_name in ('recent','all')
        or (p.view_name = 'attention'
          and coalesce(l.crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
          and (coalesce(l.crm_stage, 'new') = 'new' or (l.next_follow_up_at is not null and l.next_follow_up_at <= now() + interval '24 hours')))
        or (p.view_name = 'open' and coalesce(l.crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent'))
        or (p.view_name = 'discovery' and coalesce(l.crm_stage, 'new') = 'discovery_booked')
        or (p.view_name = 'qualified' and coalesce(l.crm_stage, 'new') in ('qualified','shortlist_sent'))
        or (p.view_name = 'nurture' and coalesce(l.crm_stage, 'new') = 'nurture')
        or (p.view_name = 'won' and coalesce(l.crm_stage, 'new') = 'won')
        or (p.view_name = 'lost' and coalesce(l.crm_stage, 'new') = 'lost')
      )
      and (p_owner_id is null or l.owner_id = p_owner_id)
      and (
        p.search_query is null
        or concat_ws(' ', l.name, l.email, l.company, l.service, l.message) ilike ('%' || p.search_query || '%')
      )
  ),
  paged as (
    select
      f.*,
      row_number() over (
        order by
          case when p.view_name = 'recent' then 0 else f.priority end asc,
          f.created_at desc,
          f.id desc
      ) as sort_index
    from filtered f
    cross join params p
    order by
      case when p.view_name = 'recent' then 0 else f.priority end asc,
      f.created_at desc,
      f.id desc
    offset ((select page_number - 1 from params) * (select page_size from params))
    limit (select page_size from params)
  ),
  enriched as (
    select
      ((to_jsonb(pg) - 'priority' - 'sort_index') || jsonb_build_object(
        'latest_activity', case when la.id is null then null else to_jsonb(la) end,
        'contact_count', coalesce(ac.contact_count, 0),
        'latest_proposal', case when lp.id is null then null else to_jsonb(lp) end
      )) as row_data,
      pg.sort_index
    from paged pg
    left join lateral (
      select a.id, a.subject_id, a.action, a.description, a.created_at
      from public.recruiter_activity a
      where a.subject_type = 'lead'
        and a.subject_id = pg.id
        and (a.action like 'client_contact_%' or a.action = 'client_followup_sent' or a.action like 'proposal_%')
      order by a.created_at desc
      limit 1
    ) la on true
    left join lateral (
      select count(*)::int as contact_count
      from public.recruiter_activity a
      where a.subject_type = 'lead'
        and a.subject_id = pg.id
        and (a.action like 'client_contact_%' or a.action = 'client_followup_sent' or a.action like 'proposal_%')
    ) ac on true
    left join lateral (
      select
        pr.id, pr.lead_id, pr.public_token, pr.status, pr.role_title, pr.service_model,
        pr.placement_fee, pr.managed_markup_percent, pr.estimated_monthly_total,
        pr.expires_at, pr.sent_at, pr.viewed_at, pr.changes_requested_at,
        pr.accepted_at, pr.declined_at, pr.decline_reason, pr.created_at
      from public.lead_proposals pr
      where pr.lead_id = pg.id
      order by pr.created_at desc
      limit 1
    ) lp on true
  ),
  metrics as (
    select
      count(*) filter (where coalesce(crm_stage, 'new') = 'new' and first_contact_at is null)::int as needs_first_contact,
      count(*) filter (
        where coalesce(crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
          and next_follow_up_at is not null
          and next_follow_up_at <= now()
      )::int as followups_due,
      count(*) filter (
        where discovery_scheduled_at is not null
          and discovery_completed_at is null
          and discovery_scheduled_at >= now() - interval '2 hours'
      )::int as discovery_booked,
      count(*) filter (where coalesce(crm_stage, 'new') in ('qualified','shortlist_sent'))::int as qualified,
      count(*) filter (
        where coalesce(crm_stage, 'new') = 'won'
          and won_at is not null
          and won_at >= date_trunc('month', now())
      )::int as won_this_month,
      coalesce(sum(estimated_value_usd) filter (
        where coalesce(crm_stage, 'new') in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
      ), 0)::numeric as open_pipeline_value
    from public.lead_intake
  )
  select jsonb_build_object(
    'metrics', jsonb_build_object(
      'needs_first_contact', m.needs_first_contact,
      'followups_due', m.followups_due,
      'discovery_booked', m.discovery_booked,
      'qualified', m.qualified,
      'won_this_month', m.won_this_month,
      'open_pipeline_value', m.open_pipeline_value
    ),
    'total', (select count(*)::int from filtered),
    'page', (select page_number from params),
    'page_size', (select page_size from params),
    'leads', coalesce((select jsonb_agg(e.row_data order by e.sort_index) from enriched e), '[]'::jsonb)
  )
  from metrics m;
$$;

revoke all on function public.recruiter_leads_page(text,text,uuid,integer,integer) from public;
revoke all on function public.recruiter_leads_page(text,text,uuid,integer,integer) from anon;
revoke all on function public.recruiter_leads_page(text,text,uuid,integer,integer) from authenticated;
grant execute on function public.recruiter_leads_page(text,text,uuid,integer,integer) to service_role;
