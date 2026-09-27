-- Align legacy VA state with the current 80% approval and public-directory policies.

-- Any record that says it is directory-visible but is not actually eligible for
-- the public directory should be private until a recruiter explicitly publishes
-- it again after the requirements are satisfied.
update public.va_profiles v
set directory_visible = false,
    updated_at = now()
where v.directory_visible = true
  and not exists (
    select 1
    from private.public_va_directory_rows() p
    where p.user_id = v.user_id
  );

-- The approval floor is now 80%. Repair legacy Approved/Bench records below that
-- floor only when they are not already in a live client process.
with below_floor as (
  select d.user_id
  from public.recruiter_va_directory d
  where d.stage in ('approved','bench')
    and coalesce(d.completion_score,0) < 80
    and not exists (
      select 1
      from public.job_shortlist_candidates s
      where s.va_id = d.user_id
        and s.shortlist_status = 'released'
    )
    and not exists (
      select 1
      from public.candidate_interviews i
      where i.va_id = d.user_id
        and i.status <> 'cancelled'
    )
    and not exists (
      select 1
      from public.applications a
      where a.va_id = d.user_id
        and a.status in ('interview','offered','hired')
    )
    and not exists (
      select 1
      from public.placement_offers o
      where o.va_id = d.user_id
        and o.status not in ('declined','cancelled')
    )
)
update public.va_vetting vv
set stage = 'profile',
    updated_at = now()
from below_floor b
where vv.va_id = b.user_id;
