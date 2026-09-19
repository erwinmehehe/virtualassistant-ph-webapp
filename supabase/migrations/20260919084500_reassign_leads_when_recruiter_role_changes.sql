-- Keep active client leads owned by active recruiters only.
-- If a recruiter is later changed to a VA/inactive account, move their open
-- client leads to the current default recruiter instead of leaving them stranded.

create or replace function public.reassign_open_client_leads_after_recruiter_change()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  replacement uuid;
begin
  if old.role = 'recruiter'
     and old.account_status = 'active'
     and (new.role is distinct from 'recruiter' or new.account_status is distinct from 'active') then
    replacement := public.default_recruiter_id();

    update public.lead_intake
    set owner_id = replacement
    where owner_id = new.id
      and lead_type = 'client_hiring'
      and coalesce(crm_stage,'new') not in ('won','lost')
      and status <> 'archived';
  end if;

  return new;
end;
$function$;

drop trigger if exists reassign_open_client_leads_after_recruiter_change on public.profiles;
create trigger reassign_open_client_leads_after_recruiter_change
after update of role, account_status on public.profiles
for each row
execute function public.reassign_open_client_leads_after_recruiter_change();

-- One-time repair for any historical active client leads owned by non-recruiters.
update public.lead_intake l
set owner_id = public.default_recruiter_id()
where l.lead_type = 'client_hiring'
  and coalesce(l.crm_stage,'new') not in ('won','lost')
  and l.status <> 'archived'
  and l.owner_id is not null
  and exists (
    select 1
    from public.profiles p
    where p.id = l.owner_id
      and (p.role <> 'recruiter' or p.account_status <> 'active')
  );
