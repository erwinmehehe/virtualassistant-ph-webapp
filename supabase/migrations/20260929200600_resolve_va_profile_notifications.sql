-- Resolve VA profile alerts when the underlying condition is actually fixed.

create or replace function private.resolve_va_profile_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if nullif(btrim(coalesce(new.address, '')), '') is not null then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where user_id = new.user_id
       and type = 'private_address_request'
       and done_at is null;
  end if;

  if new.availability_confirmed_at is not null
     and new.availability_confirmed_at is distinct from old.availability_confirmed_at then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where user_id = new.user_id
       and type = 'availability'
       and done_at is null
       and created_at <= new.availability_confirmed_at;
  end if;

  return new;
end;
$function$;

drop trigger if exists resolve_va_profile_notifications on public.va_profiles;
create trigger resolve_va_profile_notifications
after update of address, availability_confirmed_at on public.va_profiles
for each row
execute function private.resolve_va_profile_notifications();

revoke execute on function private.resolve_va_profile_notifications() from public, anon, authenticated;

update public.notifications n
   set done_at = coalesce(n.done_at, now()),
       read_at = coalesce(n.read_at, now()),
       snoozed_until = null
  from public.va_profiles v
 where n.user_id = v.user_id
   and n.type = 'private_address_request'
   and n.done_at is null
   and nullif(btrim(coalesce(v.address, '')), '') is not null;

update public.notifications n
   set done_at = coalesce(n.done_at, now()),
       read_at = coalesce(n.read_at, now()),
       snoozed_until = null
  from public.va_profiles v
 where n.user_id = v.user_id
   and n.type = 'availability'
   and n.done_at is null
   and v.availability_confirmed_at is not null
   and n.created_at <= v.availability_confirmed_at;
