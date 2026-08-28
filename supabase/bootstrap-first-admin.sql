-- One-time first Admin bootstrap.
-- Replace the email below with an EXISTING Supabase Auth account, then run in the Supabase SQL Editor.
-- Public signup intentionally exposes only Client and VA roles.

do $$
declare
  target_email text := 'CHANGE_ME@example.com';
  target_id uuid;
  target_name text;
begin
  if target_email = 'CHANGE_ME@example.com' then
    raise exception 'Replace CHANGE_ME@example.com before running this script.';
  end if;

  select id, nullif(raw_user_meta_data->>'full_name', '')
    into target_id, target_name
  from auth.users
  where lower(email) = lower(target_email)
  limit 1;

  if target_id is null then
    raise exception 'No Supabase Auth user exists for %', target_email;
  end if;

  insert into public.profiles (id, role, full_name)
  values (target_id, 'admin', target_name)
  on conflict (id) do update set role = 'admin';

  raise notice 'Promoted % to admin (%)', target_email, target_id;
end $$;
