-- Surface inbound client replies as an explicit recruiter action state.
-- This is derived from recruiter_activity so existing exact reply attribution
-- remains the source of truth and no separate read/unread flag can drift.

create or replace view public.recruiter_client_reply_state as
with activity as (
  select
    ra.subject_id as lead_id,
    max(ra.created_at) filter (
      where ra.action = 'client_contact_email'
    ) as last_client_reply_at,
    max(ra.created_at) filter (
      where ra.action in (
        'client_followup_sent',
        'client_contact_call',
        'client_contact_meeting',
        'client_contact_follow_up',
        'discovery_booked',
        'discovery_qualified',
        'discovery_nurture',
        'discovery_lost',
        'discovery_discovery_booked',
        'discovery_no_show_rebook_sent'
      )
    ) as last_recruiter_response_at,
    (
      array_agg(ra.action order by ra.created_at desc) filter (
        where ra.action in (
          'client_followup_sent',
          'client_contact_call',
          'client_contact_meeting',
          'client_contact_follow_up',
          'discovery_booked',
          'discovery_qualified',
          'discovery_nurture',
          'discovery_lost',
          'discovery_discovery_booked',
          'discovery_no_show_rebook_sent'
        )
      )
    )[1] as last_recruiter_response_action
  from public.recruiter_activity ra
  where ra.subject_type = 'lead'
    and (
      ra.action = 'client_contact_email'
      or ra.action in (
        'client_followup_sent',
        'client_contact_call',
        'client_contact_meeting',
        'client_contact_follow_up',
        'discovery_booked',
        'discovery_qualified',
        'discovery_nurture',
        'discovery_lost',
        'discovery_discovery_booked',
        'discovery_no_show_rebook_sent'
      )
    )
  group by ra.subject_id
)
select
  l.id as lead_id,
  l.owner_id,
  l.job_id,
  l.name,
  l.company,
  l.crm_stage,
  l.first_contact_at,
  l.last_contact_at,
  a.last_client_reply_at,
  a.last_recruiter_response_at,
  a.last_recruiter_response_action,
  case
    when a.last_client_reply_at is not null
      and (
        a.last_recruiter_response_at is null
        or a.last_client_reply_at > a.last_recruiter_response_at
      )
      then 'needs_action'
    when a.last_recruiter_response_action in ('client_followup_sent', 'discovery_no_show_rebook_sent')
      then 'awaiting_reply'
    when a.last_recruiter_response_at is not null
      then 'handled'
    when l.first_contact_at is not null
      then 'awaiting_reply'
    else 'not_contacted'
  end as reply_status
from public.lead_intake l
left join activity a on a.lead_id = l.id
where l.lead_type = 'client_hiring';

revoke all on public.recruiter_client_reply_state from public, anon, authenticated;
grant select on public.recruiter_client_reply_state to service_role;
