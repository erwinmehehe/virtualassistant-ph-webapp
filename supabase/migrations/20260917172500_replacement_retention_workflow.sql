-- Structured replacement and retention workflow.
-- Existing support requests and placement lifecycle remain the source of truth;
-- these fields make replacement SLA, guarantee review, renewal, and offboarding auditable.

alter table public.placement_support_requests
  add column if not exists replacement_reason text,
  add column if not exists replacement_sla_due_on date,
  add column if not exists guarantee_status text,
  add column if not exists guarantee_notes text;

alter table public.placement_support_requests
  drop constraint if exists placement_support_replacement_reason_check;
alter table public.placement_support_requests
  add constraint placement_support_replacement_reason_check check (
    replacement_reason is null or replacement_reason in (
      'performance','attendance_reliability','skills_fit','communication',
      'schedule_timezone','role_changed','working_style','va_unavailable','other'
    )
  );

alter table public.placement_support_requests
  drop constraint if exists placement_support_guarantee_status_check;
alter table public.placement_support_requests
  add constraint placement_support_guarantee_status_check check (
    guarantee_status is null or guarantee_status in (
      'not_reviewed','eligible','not_eligible','approved','declined'
    )
  );

alter table public.placement_support_requests
  drop constraint if exists placement_support_guarantee_notes_length_check;
alter table public.placement_support_requests
  add constraint placement_support_guarantee_notes_length_check check (
    guarantee_notes is null or char_length(guarantee_notes) <= 2000
  );

create index if not exists placement_support_replacement_sla_idx
  on public.placement_support_requests(replacement_sla_due_on, status)
  where request_type = 'replacement' and status in ('open','acknowledged');

alter table public.workrooms
  add column if not exists renewal_date date,
  add column if not exists renewal_status text not null default 'not_set',
  add column if not exists end_reason text,
  add column if not exists offboarding_notes text;

alter table public.workrooms
  drop constraint if exists workrooms_renewal_status_check;
alter table public.workrooms
  add constraint workrooms_renewal_status_check check (
    renewal_status in ('not_set','upcoming','renewed','not_renewing')
  );

alter table public.workrooms
  drop constraint if exists workrooms_end_reason_check;
alter table public.workrooms
  add constraint workrooms_end_reason_check check (
    end_reason is null or end_reason in (
      'completed','client_cancelled','va_resigned','performance',
      'attendance_reliability','budget','role_changed','business_change',
      'replacement','other'
    )
  );

alter table public.workrooms
  drop constraint if exists workrooms_offboarding_notes_length_check;
alter table public.workrooms
  add constraint workrooms_offboarding_notes_length_check check (
    offboarding_notes is null or char_length(offboarding_notes) <= 4000
  );

create index if not exists workrooms_renewal_date_idx
  on public.workrooms(renewal_date)
  where renewal_date is not null and placement_stage <> 'ended';
