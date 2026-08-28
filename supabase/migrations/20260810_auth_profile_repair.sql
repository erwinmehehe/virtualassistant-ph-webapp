-- Repair authenticated users that pre-date the profile bootstrap trigger.
-- Safe to run more than once.

insert into public.profiles (id, role, full_name)
select
  u.id,
  (
    case
      when u.raw_app_meta_data->>'role' in ('client','va','recruiter','admin') then u.raw_app_meta_data->>'role'
      when u.raw_user_meta_data->>'role' in ('client','va') then u.raw_user_meta_data->>'role'
      else null
    end
  )::public.user_role,
  nullif(coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'), '')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id)
  and (
    u.raw_app_meta_data->>'role' in ('client','va','recruiter','admin')
    or u.raw_user_meta_data->>'role' in ('client','va')
  )
on conflict (id) do nothing;

insert into public.client_profiles (user_id)
select p.id
from public.profiles p
where p.role = 'client'
on conflict (user_id) do nothing;

insert into public.va_profiles (user_id, slug)
select p.id, concat('va-', substr(p.id::text, 1, 8))
from public.profiles p
where p.role = 'va'
on conflict (user_id) do nothing;

insert into public.va_vetting (va_id)
select p.id
from public.profiles p
where p.role = 'va'
on conflict (va_id) do nothing;
