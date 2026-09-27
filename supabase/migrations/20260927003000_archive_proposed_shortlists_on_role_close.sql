create or replace function public.archive_proposed_shortlist_when_role_closes()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if new.status::text = 'closed'
     or coalesce(new.hiring_stage, '') in ('closed', 'filled') then
    update public.job_shortlist_candidates
    set shortlist_status = 'hidden',
        updated_at = now()
    where job_id = new.id
      and shortlist_status = 'proposed';
  end if;

  return new;
end;
$function$;

drop trigger if exists archive_proposed_shortlist_when_role_closes on public.jobs;
create trigger archive_proposed_shortlist_when_role_closes
after update of status, hiring_stage on public.jobs
for each row
when (
  new.status::text = 'closed'
  or coalesce(new.hiring_stage, '') in ('closed', 'filled')
)
execute function public.archive_proposed_shortlist_when_role_closes();

update public.job_shortlist_candidates s
set shortlist_status = 'hidden',
    updated_at = now()
from public.jobs j
where s.job_id = j.id
  and s.shortlist_status = 'proposed'
  and (
    j.status::text = 'closed'
    or coalesce(j.hiring_stage, '') in ('closed', 'filled')
  );
