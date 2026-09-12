-- v4149: Make proposal acceptance one database transaction.
-- Auth account creation/invite generation stays in the server action because Supabase Auth
-- is outside Postgres. Once a client identity is resolved, every core hiring write below
-- commits or rolls back together.

create or replace function public.accept_lead_proposal_atomic(
  p_token uuid,
  p_acceptance_name text,
  p_client_id uuid,
  p_job_id uuid,
  p_job_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_proposal public.lead_proposals%rowtype;
  v_lead public.lead_intake%rowtype;
  v_job public.jobs%rowtype;
  v_job_id uuid;
  v_existing_accepted uuid;
  v_now timestamptz := clock_timestamp();
  v_title text := nullif(btrim(p_job_payload ->> 'title'), '');
  v_slug text := nullif(btrim(p_job_payload ->> 'slug'), '');
  v_description text := p_job_payload ->> 'description';
  v_summary text := p_job_payload ->> 'summary';
  v_company_name text := p_job_payload ->> 'company_name';
  v_timezone text := p_job_payload ->> 'timezone';
  v_onboarding_plan text := p_job_payload ->> 'onboarding_plan';
  v_engagement_length text := p_job_payload ->> 'engagement_length';
  v_start_timing text := p_job_payload ->> 'start_timing';
  v_responsibilities text[] := coalesce(
    (select array_agg(value) from jsonb_array_elements_text(coalesce(p_job_payload -> 'responsibilities', '[]'::jsonb)) as value),
    '{}'::text[]
  );
  v_categories text[] := coalesce(
    (select array_agg(value) from jsonb_array_elements_text(coalesce(p_job_payload -> 'categories', '[]'::jsonb)) as value),
    '{}'::text[]
  );
begin
  if p_token is null or p_acceptance_name is null or char_length(btrim(p_acceptance_name)) < 2 then
    return jsonb_build_object('ok', false, 'code', 'invalid_acceptance');
  end if;

  select *
  into v_proposal
  from public.lead_proposals
  where public_token = p_token
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'proposal_not_found');
  end if;

  if v_proposal.status = 'accepted' then
    select * into v_job from public.jobs where id = v_proposal.job_id;
    return jsonb_build_object(
      'ok', true,
      'code', 'already_accepted',
      'already_accepted', true,
      'job_id', v_proposal.job_id,
      'client_id', v_job.client_id
    );
  end if;

  if v_proposal.status <> 'sent' then
    return jsonb_build_object('ok', false, 'code', 'proposal_unavailable');
  end if;

  if v_proposal.expires_at is not null and v_proposal.expires_at < v_now then
    update public.lead_proposals
      set status = 'expired', updated_at = v_now
    where id = v_proposal.id;
    return jsonb_build_object('ok', false, 'code', 'proposal_expired');
  end if;

  select *
  into v_lead
  from public.lead_intake
  where id = v_proposal.lead_id
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'code', 'lead_not_found');
  end if;

  select id
  into v_existing_accepted
  from public.lead_proposals
  where lead_id = v_lead.id
    and id <> v_proposal.id
    and status = 'accepted'
  limit 1;

  if v_existing_accepted is not null then
    return jsonb_build_object('ok', false, 'code', 'lead_already_accepted');
  end if;

  if p_client_id is not null then
    perform 1
    from public.profiles
    where id = p_client_id
      and role = 'client'::public.user_role
      and account_status = 'active';
    if not found then
      return jsonb_build_object('ok', false, 'code', 'client_identity_invalid');
    end if;
  end if;

  if v_title is null then
    return jsonb_build_object('ok', false, 'code', 'job_title_missing');
  end if;

  v_job_id := coalesce(v_proposal.job_id, v_lead.job_id, p_job_id, gen_random_uuid());

  select *
  into v_job
  from public.jobs
  where id = v_job_id
  for update;

  if not found then
    select *
    into v_job
    from public.jobs
    where lead_id = v_lead.id
    for update;
    if found then
      v_job_id := v_job.id;
    end if;
  end if;

  if v_job.id is not null then
    if v_job.lead_id is not null and v_job.lead_id <> v_lead.id then
      return jsonb_build_object('ok', false, 'code', 'job_lead_conflict');
    end if;
    if v_job.client_id is not null and p_client_id is null then
      return jsonb_build_object('ok', false, 'code', 'existing_client_unverified');
    end if;
    if v_job.client_id is not null and p_client_id is not null and v_job.client_id <> p_client_id then
      return jsonb_build_object('ok', false, 'code', 'job_client_conflict');
    end if;

    update public.jobs
    set
      client_id = p_client_id,
      lead_id = v_lead.id,
      title = v_title,
      company_name = v_company_name,
      summary = v_summary,
      description = v_description,
      responsibilities = v_responsibilities,
      categories = v_categories,
      hours_per_week = nullif(p_job_payload ->> 'hours_per_week', '')::integer,
      min_hourly_rate = nullif(p_job_payload ->> 'min_hourly_rate', '')::numeric,
      max_hourly_rate = nullif(p_job_payload ->> 'max_hourly_rate', '')::numeric,
      timezone = v_timezone,
      overlap_hours = coalesce(nullif(p_job_payload ->> 'overlap_hours', '')::integer, 4),
      live_coverage_exception = coalesce((p_job_payload ->> 'live_coverage_exception')::boolean, false),
      onboarding_plan = v_onboarding_plan,
      direct_feedback = coalesce((p_job_payload ->> 'direct_feedback')::boolean, true),
      engagement_length = v_engagement_length,
      start_timing = v_start_timing,
      service_model = v_proposal.service_model,
      status = case when p_client_id is not null then 'published'::public.job_status else 'pending'::public.job_status end,
      published_at = case when p_client_id is not null then coalesce(v_job.published_at, v_now) else null end,
      slug = coalesce(v_slug, v_job.slug),
      updated_at = v_now
    where id = v_job_id;
  else
    insert into public.jobs (
      id, client_id, lead_id, title, company_name, summary, description,
      responsibilities, categories, hours_per_week, min_hourly_rate, max_hourly_rate,
      timezone, overlap_hours, live_coverage_exception, onboarding_plan, direct_feedback,
      engagement_length, start_timing, service_model, status, published_at, slug
    ) values (
      v_job_id,
      p_client_id,
      v_lead.id,
      v_title,
      v_company_name,
      v_summary,
      v_description,
      v_responsibilities,
      v_categories,
      nullif(p_job_payload ->> 'hours_per_week', '')::integer,
      nullif(p_job_payload ->> 'min_hourly_rate', '')::numeric,
      nullif(p_job_payload ->> 'max_hourly_rate', '')::numeric,
      v_timezone,
      coalesce(nullif(p_job_payload ->> 'overlap_hours', '')::integer, 4),
      coalesce((p_job_payload ->> 'live_coverage_exception')::boolean, false),
      v_onboarding_plan,
      coalesce((p_job_payload ->> 'direct_feedback')::boolean, true),
      v_engagement_length,
      v_start_timing,
      v_proposal.service_model,
      case when p_client_id is not null then 'published'::public.job_status else 'pending'::public.job_status end,
      case when p_client_id is not null then v_now else null end,
      v_slug
    );
  end if;

  insert into public.job_commercials (
    job_id, service_model, placement_fee, managed_markup_percent, commercial_status, updated_at
  ) values (
    v_job_id,
    v_proposal.service_model,
    case when v_proposal.service_model = 'curated_placement' then v_proposal.placement_fee else null end,
    case when v_proposal.service_model = 'managed_service' then v_proposal.managed_markup_percent else null end,
    'accepted',
    v_now
  )
  on conflict (job_id) do update
    set service_model = excluded.service_model,
        placement_fee = excluded.placement_fee,
        managed_markup_percent = excluded.managed_markup_percent,
        commercial_status = excluded.commercial_status,
        updated_at = excluded.updated_at;

  if p_client_id is not null then
    insert into public.job_candidate_access (
      job_id, access_status, access_fee, currency, unlocked_at, updated_at
    ) values (
      v_job_id, 'comped', 0, 'USD', v_now, v_now
    )
    on conflict (job_id) do update
      set access_status = excluded.access_status,
          access_fee = excluded.access_fee,
          currency = excluded.currency,
          unlocked_at = excluded.unlocked_at,
          updated_at = excluded.updated_at;
  end if;

  update public.lead_proposals
  set
    status = 'accepted',
    accepted_at = v_now,
    acceptance_name = btrim(p_acceptance_name),
    job_id = v_job_id,
    updated_at = v_now
  where id = v_proposal.id;

  update public.lead_intake
  set
    crm_stage = 'won',
    status = 'converted',
    job_id = v_job_id,
    client_id = p_client_id,
    won_at = v_now,
    lost_at = null,
    lost_reason = null,
    next_follow_up_at = null,
    stage_updated_at = v_now
  where id = v_lead.id;

  insert into public.recruiter_activity (
    subject_type, subject_id, action, description, actor_id, metadata
  ) values (
    'lead',
    v_lead.id,
    'proposal_accepted',
    'Proposal accepted by ' || btrim(p_acceptance_name),
    null,
    jsonb_build_object(
      'proposal_id', v_proposal.id,
      'job_id', v_job_id,
      'client_id', p_client_id,
      'atomic', true
    )
  );

  insert into public.analytics_events (
    event_name, path, session_id, user_id, metadata
  ) values (
    'lead_won',
    '/proposal',
    v_lead.session_id::text,
    p_client_id,
    jsonb_build_object(
      'lead_id', v_lead.id,
      'proposal_id', v_proposal.id,
      'job_id', v_job_id,
      'estimated_value_usd', v_lead.estimated_value_usd,
      'atomic', true
    )
  );

  return jsonb_build_object(
    'ok', true,
    'code', 'accepted',
    'already_accepted', false,
    'job_id', v_job_id,
    'client_id', p_client_id
  );
end;
$$;

revoke all on function public.accept_lead_proposal_atomic(uuid, text, uuid, uuid, jsonb) from public;
revoke all on function public.accept_lead_proposal_atomic(uuid, text, uuid, uuid, jsonb) from anon, authenticated;
grant execute on function public.accept_lead_proposal_atomic(uuid, text, uuid, uuid, jsonb) to service_role;

comment on function public.accept_lead_proposal_atomic(uuid, text, uuid, uuid, jsonb)
is 'Atomically accepts one sent lead proposal and commits its job, commercials, candidate access, proposal, lead, audit, and analytics state. Service-role only.';
