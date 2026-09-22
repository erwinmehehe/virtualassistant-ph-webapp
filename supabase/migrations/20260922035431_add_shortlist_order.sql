alter table public.job_shortlist_candidates
  add column if not exists shortlist_order integer;

with ranked as (
  select id,
         row_number() over (
           partition by job_id
           order by
             case when shortlist_status = 'released' then 0 else 1 end,
             released_at desc nulls last,
             match_score desc nulls last,
             created_at asc
         ) as position
  from public.job_shortlist_candidates
  where shortlist_status in ('proposed','released')
)
update public.job_shortlist_candidates s
set shortlist_order = ranked.position
from ranked
where s.id = ranked.id
  and s.shortlist_order is null;

create index if not exists job_shortlist_candidates_job_order_idx
  on public.job_shortlist_candidates(job_id, shortlist_status, shortlist_order);
