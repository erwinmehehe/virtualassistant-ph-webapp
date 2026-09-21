drop policy if exists "server only email change requests" on public.account_email_change_requests;
create policy "server only email change requests"
  on public.account_email_change_requests
  for all
  to anon, authenticated
  using (false)
  with check (false);
