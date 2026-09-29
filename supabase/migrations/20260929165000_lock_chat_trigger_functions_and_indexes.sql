-- Lock trigger-only helpers out of the Data API and add chat FK indexes.

revoke execute on function public.validate_client_recruiter_thread() from public, anon, authenticated;
revoke execute on function public.validate_client_recruiter_message() from public, anon, authenticated;
revoke execute on function public.sync_crm_identity_from_lead() from public, anon, authenticated;

create index if not exists client_recruiter_messages_sender_idx
  on public.client_recruiter_messages(sender_id);

create index if not exists recruiter_va_messages_sender_idx
  on public.recruiter_va_messages(sender_id);
