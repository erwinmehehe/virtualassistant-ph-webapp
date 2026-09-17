create or replace function public.recruiter_lead_cleanup_queue(
  p_user_id uuid,
  p_limit integer default 50
)
returns jsonb
language sql
stable
security invoker
set search_path = 'public'
as $function$
  with base as (
    select
      l.id,
      l.name,
      l.email,
      l.company,
      l.service,
      coalesce(l.crm_stage, 'new') as crm_stage,
      l.owner_id,
      l.created_at,
      l.first_contact_at,
      l.last_contact_at,
      l.next_follow_up_at,
      l.first_response_due_at,
      l.discovery_scheduled_at,
      l.discovery_completed_at,
      l.discovery_cancelled_at,
      greatest(
        l.created_at,
        coalesce(l.stage_updated_at, l.created_at),
        coalesce(l.last_contact_at, l.created_at)
      ) as last_touch_at,
      coalesce((
        select count(*)
        from public.recruiter_activity ra
        where ra.subject_type = 'lead'
          and ra.subject_id = l.id
          and (
            ra.action like 'client_contact_%'
            or ra.action in ('client_followup_sent', 'lead_cleanup_followup_sent')
          )
      ), 0)::integer as contact_count,
      (
        l.discovery_scheduled_at is not null
        and l.discovery_scheduled_at > now()
        and l.discovery_completed_at is null
        and l.discovery_cancelled_at is null
      ) as has_future_discovery
    from public.lead_intake l
    where l.lead_type = 'client_hiring'
      and coalesce(l.crm_stage, 'new') in (
        'new', 'contacted', 'discovery_booked', 'qualified',
        'terms_sent', 'shortlist_sent', 'nurture'
      )
      and l.owner_id = p_user_id
  ),
  flagged as (
    select
      b.*,
      (
        b.first_contact_at is null
        and coalesce(b.first_response_due_at, b.created_at + interval '30 minutes') < now()
      ) as missed_first_response,
      (
        b.next_follow_up_at is not null
        and b.next_follow_up_at < now()
      ) as follow_up_overdue,
      (
        b.next_follow_up_at is null
        and not b.has_future_discovery
        and not (b.crm_stage = 'new' and b.first_contact_at is null)
      ) as no_next_step,
      (
        b.last_touch_at < now() - interval '3 days'
        and not b.has_future_discovery
      ) as stale_3d,
      (
        b.last_touch_at < now() - interval '7 days'
        and not b.has_future_discovery
      ) as stale_7d,
      (
        b.last_touch_at < now() - interval '7 days'
        and b.next_follow_up_at is null
        and b.first_contact_at is not null
        and b.contact_count >= 2
        and not b.has_future_discovery
      ) as ready_to_close
    from base b
  ),
  actionable as (
    select
      f.*,
      array_remove(array[
        case when f.missed_first_response then 'Missed first response' end,
        case when f.follow_up_overdue then 'Follow-up overdue' end,
        case when f.no_next_step then 'No next step' end,
        case when f.stale_7d then 'Stale 7 days' when f.stale_3d then 'Stale 3 days' end,
        case when f.ready_to_close then 'Ready to close' end
      ]::text[], null) as cleanup_labels,
      case
        when f.missed_first_response then 'Missed first response'
        when f.follow_up_overdue then 'Follow-up overdue'
        when f.ready_to_close then 'Ready to close'
        when f.stale_7d then 'Stale 7 days'
        when f.no_next_step then 'No next step'
        else 'Stale 3 days'
      end as primary_reason,
      case
        when f.missed_first_response then 0
        when f.follow_up_overdue then 1
        when f.ready_to_close then 2
        when f.stale_7d then 3
        when f.no_next_step then 4
        else 5
      end as priority_rank,
      case
        when f.missed_first_response then coalesce(f.first_response_due_at, f.created_at + interval '30 minutes')
        when f.follow_up_overdue then f.next_follow_up_at
        else f.last_touch_at
      end as due_at
    from flagged f
    where f.missed_first_response
       or f.follow_up_overdue
       or f.no_next_step
       or f.stale_3d
       or f.stale_7d
       or f.ready_to_close
  ),
  ranked as (
    select *
    from actionable
    order by priority_rank asc, due_at asc, created_at asc
    limit greatest(coalesce(p_limit, 50), 1)
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', id,
        'name', name,
        'email', email,
        'company', company,
        'service', service,
        'crm_stage', crm_stage,
        'created_at', created_at,
        'first_contact_at', first_contact_at,
        'last_contact_at', last_contact_at,
        'next_follow_up_at', next_follow_up_at,
        'last_touch_at', last_touch_at,
        'contact_count', contact_count,
        'primary_reason', primary_reason,
        'cleanup_labels', to_jsonb(cleanup_labels),
        'due_at', due_at
      )
      order by priority_rank asc, due_at asc, created_at asc
    ),
    '[]'::jsonb
  )
  from ranked;
$function$;

revoke execute on function public.recruiter_lead_cleanup_queue(uuid, integer) from public, anon, authenticated;
grant execute on function public.recruiter_lead_cleanup_queue(uuid, integer) to service_role;
