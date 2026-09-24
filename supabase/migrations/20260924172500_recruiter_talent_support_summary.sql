-- Consolidate Recruiter Talent support reads while preserving the existing
-- filtered/paginated directory query used by bulk actions.
create or replace function public.recruiter_talent_support_summary()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with base as materialized (
  select *
  from recruiter_va_directory
),
recent_accounts as materialized (
  select
    user_id,
    full_name,
    email_verified,
    account_created_at,
    last_activity_at,
    completion_score,
    stage,
    account_status
  from base
  where account_status='active'
    and account_created_at>=now()-interval '7 days'
  order by account_created_at desc
  limit 100
),
stalled as (
  select *
  from recent_accounts
  where coalesce(completion_score,0)=0
  order by coalesce(email_verified,false) desc, account_created_at desc
  limit 6
),
active_roles as (
  select id,title,company_name,status,client_id,created_at
  from jobs
  where status in ('pending','published')
  order by created_at desc
  limit 100
)
select jsonb_build_object(
  'saved_view_counts', jsonb_build_object(
    'all', (select count(*)::int from base),
    'approval_ready', (
      select count(*)::int from base
      where completion_score>=60
        and account_status='active'
        and coalesce(stage,'profile') not in ('approved','bench','rejected')
    ),
    'approval_cleanup', (
      select count(*)::int from base
      where stage in ('approved','bench')
        and completion_score<60
        and account_status='active'
    ),
    'missing_photo', (
      select count(*)::int from base where avatar_url is null
    ),
    'approved_hidden', (
      select count(*)::int from base
      where stage in ('approved','bench')
        and account_status='active'
        and (
          directory_visible is false
          or completion_score<80
          or avatar_url is null
          or years_experience<2
          or years_experience is null
          or hourly_rate<6
          or hourly_rate is null
          or availability_status<>'available'
          or availability_status is null
        )
    ),
    'bench', (
      select count(*)::int from base where stage='bench'
    ),
    'stale_60', (
      select count(*)::int from base
      where last_activity_at<now()-interval '60 days'
    ),
    'available', (
      select count(*)::int from base where availability_status='available'
    ),
    'needs_review', (
      select count(*)::int from base where stage='recruiter_review'
    )
  ),
  'new_accounts_count', (select count(*)::int from recent_accounts),
  'recent_zero_count', (
    select count(*)::int from recent_accounts where coalesce(completion_score,0)=0
  ),
  'verified_recent_zero_count', (
    select count(*)::int from recent_accounts
    where coalesce(completion_score,0)=0 and coalesce(email_verified,false)=true
  ),
  'stalled', coalesce((
    select jsonb_agg(to_jsonb(s) order by coalesce(s.email_verified,false) desc, s.account_created_at desc)
    from stalled s
  ), '[]'::jsonb),
  'roles', coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id',r.id,
        'title',r.title,
        'company_name',r.company_name,
        'status',r.status,
        'client_id',r.client_id
      )
      order by r.created_at desc
    )
    from active_roles r
  ), '[]'::jsonb)
);
$function$;

create or replace function public.recruiter_talent_page_enrichment(p_va_ids uuid[])
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
with requested as (
  select unnest(coalesce(p_va_ids,'{}'::uuid[])) as user_id
),
rows as (
  select
    q.user_id,
    case
      when r.va_id is null then null
      else jsonb_build_object(
        'va_id',r.va_id,
        'last_sent_at',r.last_sent_at,
        'reminder_count',r.reminder_count
      )
    end as reminder,
    exists(
      select 1
      from public_va_directory d
      where d.user_id=q.user_id
    ) as public_now,
    case
      when v.user_id is null then '{}'::jsonb
      else jsonb_build_object(
        'user_id',v.user_id,
        'headline',v.headline,
        'bio',v.bio,
        'primary_category',v.primary_category,
        'skills',coalesce(v.skills,'{}'::text[]),
        'tools',coalesce(v.tools,'{}'::text[]),
        'years_experience',v.years_experience,
        'weekly_hours',v.weekly_hours,
        'hourly_rate',v.hourly_rate,
        'resume_path',v.resume_path,
        'portfolio_url',v.portfolio_url,
        'availability_status',v.availability_status,
        'public_profile_consent',v.public_profile_consent,
        'public_profile_consent_at',v.public_profile_consent_at,
        'public_profile_consent_withdrawn_at',v.public_profile_consent_withdrawn_at,
        'public_profile_consent_version',v.public_profile_consent_version
      )
    end as visibility_profile
  from requested q
  left join va_profile_reminders r on r.va_id=q.user_id
  left join va_profiles v on v.user_id=q.user_id
)
select coalesce(
  jsonb_agg(
    jsonb_build_object(
      'user_id',user_id,
      'reminder',reminder,
      'public_now',public_now,
      'visibility_profile',visibility_profile
    )
  ),
  '[]'::jsonb
)
from rows;
$function$;

revoke execute on function public.recruiter_talent_support_summary() from public, anon, authenticated;
grant execute on function public.recruiter_talent_support_summary() to service_role;

revoke execute on function public.recruiter_talent_page_enrichment(uuid[]) from public, anon, authenticated;
grant execute on function public.recruiter_talent_page_enrichment(uuid[]) to service_role;
