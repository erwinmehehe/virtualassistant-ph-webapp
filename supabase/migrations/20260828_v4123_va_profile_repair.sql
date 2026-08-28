-- v4.12.3: repair VA account/profile routing for recruiter and public profile views.
-- Safe to run after the existing v4.10+ migrations.

-- Every auth/profile row with role=va should have a structured va_profiles row.
insert into public.va_profiles (user_id, slug)
select p.id, 'va-' || left(replace(p.id::text, '-', ''), 12)
from public.profiles p
left join public.va_profiles v on v.user_id = p.id
where p.role = 'va' and v.user_id is null
on conflict (user_id) do nothing;

-- Older/imported VA records may predate slug generation. Give them a stable route.
update public.va_profiles
set slug = 'va-' || left(replace(user_id::text, '-', ''), 12),
    updated_at = now()
where slug is null or btrim(slug) = '';

-- Recruiter and public routing expect a vetting row even before screening starts.
insert into public.va_vetting (va_id, stage)
select v.user_id, 'profile'
from public.va_profiles v
left join public.va_vetting vv on vv.va_id = v.user_id
where vv.va_id is null
on conflict (va_id) do nothing;
