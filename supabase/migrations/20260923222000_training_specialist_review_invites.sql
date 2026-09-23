-- Secure external specialist-review invites.
-- Raw review tokens are never stored; only a SHA-256 hash is persisted.

create table if not exists public.training_specialist_review_invites (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.training_courses(id) on delete cascade,
  reviewer_email text not null,
  reviewer_name text not null,
  reviewer_role text not null,
  review_revision integer not null,
  assigned_revision integer not null,
  course_content_version integer not null,
  token_hash text not null unique,
  due_at timestamptz,
  expires_at timestamptz not null,
  status text not null default 'pending'
    check (status in ('pending', 'opened', 'submitted', 'revoked')),
  sent_at timestamptz,
  opened_at timestamptz,
  submitted_at timestamptz,
  assigned_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.training_specialist_review_invites enable row level security;

revoke all on public.training_specialist_review_invites from anon, authenticated;
grant all on public.training_specialist_review_invites to service_role;

create index if not exists training_specialist_review_invites_course_idx
  on public.training_specialist_review_invites(course_id, created_at desc);

create index if not exists training_specialist_review_invites_status_idx
  on public.training_specialist_review_invites(status, due_at, created_at desc);

create unique index if not exists training_specialist_review_invites_one_active_per_course
  on public.training_specialist_review_invites(course_id)
  where status in ('pending', 'opened');


-- Keep external handoff activity in the same append-only specialist review timeline.
alter table public.training_specialist_review_events
  drop constraint if exists training_specialist_review_events_event_type_check;

alter table public.training_specialist_review_events
  add constraint training_specialist_review_events_event_type_check
  check (event_type in (
    'assigned',
    'reassigned',
    'progress_saved',
    'changes_requested',
    'approved',
    'invalidated',
    'invite_sent',
    'invite_opened',
    'invite_revoked',
    'external_changes_requested',
    'external_approved'
  ));


-- Apply an external specialist decision atomically so a stale or double-used
-- link cannot partially update review evidence.
create or replace function public.submit_external_training_specialist_review(
  p_invite_id uuid,
  p_decision text,
  p_checklist jsonb,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.training_specialist_review_invites%rowtype;
  v_course public.training_courses%rowtype;
  v_review public.training_specialist_reviews%rowtype;
  v_now timestamptz := now();
  v_event_type text;
begin
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid specialist review decision';
  end if;
  if length(trim(coalesce(p_notes, ''))) < 20 then
    raise exception 'specialist review notes are required';
  end if;
  if jsonb_typeof(coalesce(p_checklist, '{}'::jsonb)) <> 'object' then
    raise exception 'invalid specialist review checklist';
  end if;

  select *
  into v_invite
  from public.training_specialist_review_invites
  where id = p_invite_id
    and status in ('pending', 'opened')
    and expires_at > v_now
  for update;

  if not found then
    raise exception 'specialist review invite is no longer active';
  end if;

  select *
  into v_course
  from public.training_courses
  where id = v_invite.course_id
    and review_requirement = 'specialist'
  for update;

  if not found then
    raise exception 'specialist course is unavailable';
  end if;

  select *
  into v_review
  from public.training_specialist_reviews
  where course_id = v_invite.course_id
  for update;

  if not found
     or v_course.content_version <> v_invite.course_content_version
     or v_review.review_revision <> v_invite.review_revision
     or v_review.assigned_revision <> v_invite.assigned_revision
     or v_review.assigned_reviewer_name is distinct from v_invite.reviewer_name
     or v_review.assigned_reviewer_role is distinct from v_invite.reviewer_role then
    raise exception 'specialist review assignment is stale';
  end if;

  update public.training_specialist_reviews
  set reviewer_name = v_invite.reviewer_name,
      reviewer_role = v_invite.reviewer_role,
      checklist = p_checklist,
      notes = p_notes,
      decision = p_decision,
      reviewed_at = case when p_decision = 'approved' then v_now else null end,
      updated_at = v_now
  where course_id = v_invite.course_id;

  update public.training_courses
  set specialist_reviewed_by = case when p_decision = 'approved' then v_invite.reviewer_name else null end,
      specialist_reviewer_role = case when p_decision = 'approved' then v_invite.reviewer_role else null end,
      specialist_review_notes = case when p_decision = 'approved' then p_notes else null end,
      specialist_reviewed_at = case when p_decision = 'approved' then v_now else null end,
      status = 'draft',
      published_at = null,
      updated_at = v_now
  where id = v_invite.course_id;

  v_event_type := case
    when p_decision = 'approved' then 'external_approved'
    else 'external_changes_requested'
  end;

  insert into public.training_specialist_review_events (
    course_id,
    event_type,
    actor_id,
    actor_label,
    reviewer_name,
    reviewer_role,
    review_due_date,
    review_revision,
    assigned_revision,
    course_content_version,
    checklist,
    notes
  ) values (
    v_invite.course_id,
    v_event_type,
    null,
    'External specialist reviewer',
    v_invite.reviewer_name,
    v_invite.reviewer_role,
    v_review.review_due_date,
    v_invite.review_revision,
    v_invite.assigned_revision,
    v_invite.course_content_version,
    p_checklist,
    p_notes
  );

  update public.training_specialist_review_invites
  set status = 'submitted',
      submitted_at = v_now,
      updated_at = v_now
  where id = v_invite.id;
end;
$$;

revoke all on function public.submit_external_training_specialist_review(uuid, text, jsonb, text)
  from public, anon, authenticated;
grant execute on function public.submit_external_training_specialist_review(uuid, text, jsonb, text)
  to service_role;
