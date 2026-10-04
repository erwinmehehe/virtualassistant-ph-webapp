alter table public.lead_intake
  add column if not exists lost_reason_code text,
  add column if not exists lost_competitor text,
  add column if not exists win_back_at timestamptz;

alter table public.lead_intake
  drop constraint if exists lead_intake_lost_reason_code_check;

alter table public.lead_intake
  add constraint lead_intake_lost_reason_code_check
  check (
    lost_reason_code is null
    or lost_reason_code = any (array[
      'too_expensive'::text,
      'budget_too_low'::text,
      'hiring_postponed'::text,
      'competitor'::text,
      'hired_independently'::text,
      'couldnt_reach'::text,
      'no_show'::text,
      'wrong_service'::text,
      'offshore_concern'::text,
      'expertise_gap'::text,
      'not_a_fit'::text,
      'duplicate'::text,
      'spam'::text,
      'other'::text
    ])
  );

create index if not exists lead_intake_lost_reason_code_idx
  on public.lead_intake (lost_reason_code, lost_at desc)
  where crm_stage = 'lost';

create index if not exists lead_intake_win_back_due_idx
  on public.lead_intake (win_back_at asc)
  where crm_stage = 'lost' and win_back_at is not null;

create unique index if not exists recruiter_tasks_open_lead_winback_unique
  on public.recruiter_tasks (subject_id, title)
  where subject_type = 'lead' and status = 'todo' and title = 'Win-back follow-up';

comment on column public.lead_intake.lost_reason_code is
  'Canonical sales loss category used for win/loss reporting and recovery routing.';

comment on column public.lead_intake.lost_competitor is
  'Optional competitor or alternative chosen by the prospect when a deal is lost to a competitor.';

comment on column public.lead_intake.win_back_at is
  'Next recruiter win-back date for recoverable lost opportunities.';

update public.lead_intake
set lost_reason_code = case
  when lower(coalesce(lost_reason, '')) like '%spam%' then 'spam'
  when lower(coalesce(lost_reason, '')) like '%duplicate%' then 'duplicate'
  when lower(coalesce(lost_reason, '')) like '%no response%'
    or lower(coalesce(lost_reason, '')) like '%could not reach%'
    or lower(coalesce(lost_reason, '')) like '%stale%' then 'couldnt_reach'
  when lower(coalesce(lost_reason, '')) like '%no-show%'
    or lower(coalesce(lost_reason, '')) like '%no show%' then 'no_show'
  when lower(coalesce(lost_reason, '')) like '%too expensive%'
    or lower(coalesce(lost_reason, '')) like '%price%' then 'too_expensive'
  when lower(coalesce(lost_reason, '')) like '%budget%' then 'budget_too_low'
  when lower(coalesce(lost_reason, '')) like '%timing%'
    or lower(coalesce(lost_reason, '')) like '%postpon%'
    or lower(coalesce(lost_reason, '')) like '%not ready%' then 'hiring_postponed'
  when lower(coalesce(lost_reason, '')) like '%competitor%' then 'competitor'
  when lower(coalesce(lost_reason, '')) like '%hired elsewhere%'
    or lower(coalesce(lost_reason, '')) like '%hired independently%' then 'hired_independently'
  when lower(coalesce(lost_reason, '')) like '%offshore%'
    or lower(coalesce(lost_reason, '')) like '%trust%' then 'offshore_concern'
  when lower(coalesce(lost_reason, '')) like '%expertise%' then 'expertise_gap'
  when lower(coalesce(lost_reason, '')) like '%wrong service%'
    or lower(coalesce(lost_reason, '')) like '%wrong scope%' then 'wrong_service'
  when lower(coalesce(lost_reason, '')) like '%not a fit%' then 'not_a_fit'
  else 'other'
end
where crm_stage = 'lost'
  and lost_reason_code is null
  and coalesce(trim(lost_reason), '') <> '';
