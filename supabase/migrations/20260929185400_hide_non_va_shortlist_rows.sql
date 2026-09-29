-- A profile that stops being a VA must not remain in an active client shortlist.
-- Keep historical rows, but hide them from recruiter/client shortlist surfaces.

create or replace function private.hide_shortlists_when_va_role_removed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if old.role = 'va'::public.user_role
     and new.role is distinct from 'va'::public.user_role then
    update public.job_shortlist_candidates
       set shortlist_status = 'hidden',
           released_at = null
     where va_id = new.id
       and shortlist_status in ('proposed','released');
  end if;
  return new;
end;
$function$;

drop trigger if exists hide_shortlists_when_va_role_removed on public.profiles;
create trigger hide_shortlists_when_va_role_removed
after update of role on public.profiles
for each row
execute function private.hide_shortlists_when_va_role_removed();

revoke execute on function private.hide_shortlists_when_va_role_removed() from public, anon, authenticated;

update public.job_shortlist_candidates s
   set shortlist_status = 'hidden',
       released_at = null
 where s.shortlist_status in ('proposed','released')
   and exists (
     select 1
     from public.profiles p
     where p.id = s.va_id
       and p.role <> 'va'::public.user_role
   );
