create or replace view public.recruiter_va_directory_health as
select
  rvd.*,
  rh.registration_health,
  rh.email_confirmed,
  rh.last_sign_in_at,
  rh.has_private_address,
  rh.has_resume,
  rh.address_resume_status,
  rh.address_resume_checked_at
from public.recruiter_va_directory rvd
join public.recruiter_va_registration_health rh on rh.va_id = rvd.user_id;

revoke all on public.recruiter_va_directory_health from public, anon, authenticated;
grant select on public.recruiter_va_directory_health to service_role;

comment on view public.recruiter_va_directory_health is
  'Service-role-only recruiter talent directory with registration and private-address health flags.';
