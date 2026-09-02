-- v4.13.9: index the columns every workspace page filters on.
--
-- The dashboards were slow because almost none of these lookups had an index.
-- Before this migration the only relevant indexes were applications(job_id),
-- applications(va_id) and messages(conversation_id, created_at). Everything
-- else below was a sequential scan on every page load, including the sidebar
-- unread badges, which run on EVERY workspace route.
--
-- All are idempotent and cheap to build at current data volumes.

-- Sidebar badges and both dashboards resolve a user's conversations on every
-- page. Neither column was indexed.
create index if not exists conversations_va_idx     on public.conversations(va_id);
create index if not exists conversations_client_idx on public.conversations(client_id);

-- Unread counts filter on read_at is null. A partial index stays small because
-- read notifications and messages are the majority over time.
create index if not exists notifications_unread_idx
  on public.notifications(user_id) where read_at is null;
create index if not exists notifications_user_created_idx
  on public.notifications(user_id, created_at desc);
create index if not exists messages_unread_idx
  on public.messages(conversation_id) where read_at is null;

-- Client dashboard lists a client's roles; recruiter and public pages filter by
-- status. Neither column was indexed.
-- jobs(client_id) and jobs(status) already existed as jobs_client_id_idx and
-- jobs_status_idx; only the composite is new.
create index if not exists jobs_client_status_idx on public.jobs(client_id, status);

-- Remove the duplicate of jobs_client_id_idx added by an earlier run of this
-- migration. A second index on the same column costs writes and disk.
drop index if exists public.jobs_client_idx;

-- Recruiter dashboard counts VAs by vetting stage.
create index if not exists va_vetting_stage_idx on public.va_vetting(stage);

-- Workrooms are read by both dashboards to count hires.
create index if not exists workrooms_client_idx on public.workrooms(client_id);
create index if not exists workrooms_va_idx     on public.workrooms(va_id);

-- Applications are also filtered by status on the recruiter dashboard.
create index if not exists applications_status_idx on public.applications(status);

-- VA dashboard reads pending invitations.
create index if not exists job_invites_va_idx on public.job_invites(va_id);

-- Candidate access is joined per role on the client dashboard.
create index if not exists job_candidate_access_status_idx
  on public.job_candidate_access(access_status);

-- Confirm what now exists on these tables.
select tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('conversations','notifications','messages','jobs','va_vetting',
                    'workrooms','applications','job_invites','job_candidate_access')
order by tablename, indexname;
