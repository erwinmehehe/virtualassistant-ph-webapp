-- v4.13.4: publish approved VAs whose profiles are already complete.
--
-- directory_visible defaults to false and is otherwise only reachable as a
-- checkbox inside the profile form, so approved and fully complete profiles sat
-- hidden indefinitely -- 10 of 151 accounts were visible.
--
-- This flips ONLY the rows that already satisfy every condition in the
-- public_va_directory view. Nobody incomplete, unapproved, or unavailable is
-- touched, so no profile becomes visible that the view would have rejected.
-- Individual /va/ pages are noindex, so this affects on-site discovery only.

update public.va_profiles v
set directory_visible = true
from public.profiles p, public.va_vetting vv
where p.id = v.user_id
  and vv.va_id = v.user_id
  and v.directory_visible = false
  and vv.stage in ('approved', 'bench')
  and v.availability_status = 'available'
  and coalesce(v.years_experience, 0) >= 2
  and p.avatar_url is not null and btrim(p.avatar_url) <> ''
  and coalesce(length(btrim(v.headline)), 0) >= 8
  and coalesce(length(btrim(v.bio)), 0) >= 80
  and cardinality(v.skills) >= 5
  and coalesce(v.weekly_hours, 0) >= 1
  and coalesce(v.hourly_rate, 0) >= 5
  and v.resume_path is not null;

-- How many profiles are public now.
select count(*) as public_profiles from public.public_va_directory;
