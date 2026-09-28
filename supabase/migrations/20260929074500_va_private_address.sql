-- Collect a VA's private home/contact address for recruiter operations.
-- This field is intentionally stored only on va_profiles. It is not added to
-- public_va_directory or any public-facing profile view.

alter table public.va_profiles
  add column if not exists address text;

comment on column public.va_profiles.address is
  'Private VA address. Visible to the VA and internal service-role recruiter/admin tools only; never exposed on the public talent profile.';
