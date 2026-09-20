alter table public.client_profiles
  add column if not exists can_self_publish_jobs boolean not null default false;

comment on column public.client_profiles.can_self_publish_jobs is
  'Admin-controlled permission allowing selected clients to publish complete curated-placement jobs directly to the public jobs directory.';

create index if not exists client_profiles_self_publish_jobs_idx
  on public.client_profiles (can_self_publish_jobs)
  where can_self_publish_jobs = true;
