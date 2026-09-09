-- v4.14.3
-- Candidate identity/resume access is part of an approved agency hiring
-- engagement. Existing accepted roles should not force clients through a
-- second commercial gate just to review the shortlist.

insert into public.job_candidate_access (
  job_id,
  access_status,
  access_fee,
  currency,
  unlocked_at
)
select
  j.id,
  'comped',
  0,
  'USD',
  coalesce(j.published_at, now())
from public.jobs j
join public.job_commercials c on c.job_id = j.id
left join public.job_candidate_access a on a.job_id = j.id
where j.client_id is not null
  and j.status in ('pending', 'published')
  and c.commercial_status = 'accepted'
  and (a.job_id is null or a.access_status not in ('paid', 'comped'))
on conflict (job_id) do update
set
  access_status = 'comped',
  access_fee = 0,
  currency = 'USD',
  unlocked_at = coalesce(public.job_candidate_access.unlocked_at, excluded.unlocked_at)
where public.job_candidate_access.access_status not in ('paid', 'comped');
