-- Production runtime QA for the VAPH hiring acceptance core.
-- SAFE BY DESIGN: every synthetic row is created inside one transaction and rolled back.
-- This script intentionally does not test Auth invite/magic-link delivery or browser Server Actions.

begin;

create temporary table vaph_release_qa_ids (
  lead_id uuid,
  proposal_id uuid,
  token uuid,
  requested_job_id uuid,
  client_id uuid,
  first_result jsonb,
  second_result jsonb
) on commit drop;

insert into vaph_release_qa_ids (lead_id, proposal_id, token, requested_job_id, client_id)
select gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), id
from public.profiles
where role = 'client'::public.user_role
  and account_status = 'active'
order by created_at
limit 1;

do $$
begin
  if not exists (select 1 from vaph_release_qa_ids where client_id is not null) then
    raise exception 'No active client profile is available for rollback-only production QA';
  end if;
end
$$;

insert into public.lead_intake (
  id, name, email, service, company, hours, timezone, message, source_page,
  status, crm_stage, client_id, lead_type, discovery_scheduled_at,
  discovery_completed_at, discovery_outcome, discovery_meeting_provider,
  discovery_meeting_url, acknowledgement_sent_at
)
select
  lead_id,
  'VAPH Release QA',
  'delivered@resend.dev',
  'Administrative Virtual Assistant',
  'VAPH Release QA',
  '40',
  'Australia/Sydney',
  'Rollback-only production release verification for the hiring pipeline.',
  'release_qa',
  'new',
  'qualified',
  client_id,
  'client_hiring',
  clock_timestamp() - interval '1 hour',
  clock_timestamp(),
  'qualified',
  'google_meet',
  'https://meet.google.com/qa-release-check',
  clock_timestamp()
from vaph_release_qa_ids;

insert into public.lead_proposals (
  id, lead_id, public_token, status, role_title, summary, service_model,
  hours_per_week, placement_fee, salary_min, salary_max, salary_currency,
  responsibilities, required_skills, required_tools, sent_at, expires_at, send_count
)
select
  proposal_id,
  lead_id,
  token,
  'sent',
  'Administrative Virtual Assistant',
  'Rollback-only production release QA proposal.',
  'curated_placement',
  40,
  1000,
  40000,
  50000,
  'PHP',
  array['Inbox ownership', 'Scheduling'],
  array['Administrative support', 'Written communication'],
  array['Google Workspace'],
  clock_timestamp(),
  clock_timestamp() + interval '7 days',
  1
from vaph_release_qa_ids;

update vaph_release_qa_ids q
set first_result = public.accept_lead_proposal_atomic(
  q.token,
  'VAPH Release QA',
  q.client_id,
  q.requested_job_id,
  jsonb_build_object(
    'title', 'Administrative Virtual Assistant',
    'slug', 'release-qa-' || replace(q.requested_job_id::text, '-', ''),
    'company_name', 'VAPH Release QA',
    'summary', 'Rollback-only production release QA job.',
    'description', 'Synthetic rollback-only QA record.',
    'responsibilities', jsonb_build_array('Inbox ownership', 'Scheduling'),
    'categories', jsonb_build_array('Administrative Support'),
    'required_skills', jsonb_build_array('Administrative support', 'Written communication'),
    'required_tools', jsonb_build_array('Google Workspace'),
    'hours_per_week', '40',
    'min_hourly_rate', '5',
    'max_hourly_rate', '8',
    'timezone', 'Australia/Sydney',
    'overlap_hours', '4',
    'live_coverage_exception', 'false',
    'direct_feedback', 'true',
    'engagement_length', 'ongoing',
    'start_timing', 'ASAP'
  )
);

do $$
declare q vaph_release_qa_ids%rowtype;
begin
  select * into q from vaph_release_qa_ids limit 1;

  if coalesce((q.first_result ->> 'ok')::boolean, false) is not true
     or q.first_result ->> 'code' <> 'accepted' then
    raise exception 'Atomic acceptance failed: %', q.first_result;
  end if;

  if not exists (
    select 1
    from public.lead_intake
    where id = q.lead_id
      and crm_stage = 'won'
      and status = 'converted'
      and job_id = q.requested_job_id
      and client_id = q.client_id
  ) then
    raise exception 'Lead conversion state is inconsistent';
  end if;

  if not exists (
    select 1
    from public.jobs
    where id = q.requested_job_id
      and lead_id = q.lead_id
      and client_id = q.client_id
      and status = 'published'::public.job_status
      and hiring_stage in ('ready_to_recruit', 'sourcing')
      and published_at is not null
  ) then
    raise exception 'Accepted role is not published into recruiting';
  end if;

  if not exists (
    select 1
    from public.job_commercials
    where job_id = q.requested_job_id
      and commercial_status = 'accepted'
      and service_model = 'curated_placement'
  ) then
    raise exception 'Accepted commercials were not persisted';
  end if;

  if not exists (
    select 1
    from public.job_candidate_access
    where job_id = q.requested_job_id
      and access_status = 'comped'
      and access_fee = 0
  ) then
    raise exception 'Included candidate access was not provisioned';
  end if;

  if not exists (
    select 1
    from public.lead_proposals
    where id = q.proposal_id
      and status = 'accepted'
      and job_id = q.requested_job_id
  ) then
    raise exception 'Proposal did not reach accepted state';
  end if;

  if not exists (
    select 1
    from public.recruiter_activity
    where subject_id = q.lead_id
      and action = 'proposal_accepted'
      and metadata ->> 'atomic' = 'true'
  ) then
    raise exception 'Recruiter activity was not recorded';
  end if;

  if not exists (
    select 1
    from public.analytics_events
    where event_name = 'lead_won'
      and metadata ->> 'lead_id' = q.lead_id::text
      and metadata ->> 'atomic' = 'true'
  ) then
    raise exception 'Lead-won analytics event was not recorded';
  end if;
end
$$;

update vaph_release_qa_ids q
set second_result = public.accept_lead_proposal_atomic(
  q.token,
  'VAPH Release QA',
  q.client_id,
  q.requested_job_id,
  jsonb_build_object('title', 'Administrative Virtual Assistant')
);

do $$
declare q vaph_release_qa_ids%rowtype;
begin
  select * into q from vaph_release_qa_ids limit 1;
  if coalesce((q.second_result ->> 'ok')::boolean, false) is not true
     or q.second_result ->> 'code' <> 'already_accepted'
     or coalesce((q.second_result ->> 'already_accepted')::boolean, false) is not true then
    raise exception 'Repeat acceptance is not idempotent: %', q.second_result;
  end if;
end
$$;

select jsonb_build_object(
  'atomic_acceptance', 'passed',
  'lead_conversion', 'passed',
  'published_recruiting_role', 'passed',
  'commercials', 'passed',
  'candidate_access', 'passed',
  'activity_and_analytics', 'passed',
  'idempotent_retry', 'passed',
  'cleanup', 'rollback'
) as production_runtime_qa;

rollback;
