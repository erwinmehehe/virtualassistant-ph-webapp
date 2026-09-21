alter table public.account_deletion_requests
  drop constraint if exists account_deletion_requests_status_check;

alter table public.account_deletion_requests
  add constraint account_deletion_requests_status_check
  check (status in ('pending', 'cancelled', 'reviewing', 'approved', 'rejected'));

alter table public.account_deletion_requests
  add column if not exists reviewed_at timestamptz,
  add column if not exists reviewed_by uuid references auth.users(id) on delete set null,
  add column if not exists review_note text;

revoke update on public.account_deletion_requests from authenticated;

drop policy if exists "users update own account deletion requests"
  on public.account_deletion_requests;

create index if not exists account_deletion_requests_status_requested_idx
  on public.account_deletion_requests (status, requested_at desc);
