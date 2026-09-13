alter table public.lead_intake
  add column if not exists attachment_path text,
  add column if not exists attachment_name text,
  add column if not exists attachment_type text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'lead-attachments',
  'lead-attachments',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

alter table public.outbound_email_events drop constraint if exists outbound_email_events_status_check;
alter table public.outbound_email_events add constraint outbound_email_events_status_check
  check (status in ('sent','failed','delivered','bounced','complained','suppressed'));

create unique index if not exists outbound_email_events_provider_id_idx
  on public.outbound_email_events (provider_id)
  where provider_id is not null;
