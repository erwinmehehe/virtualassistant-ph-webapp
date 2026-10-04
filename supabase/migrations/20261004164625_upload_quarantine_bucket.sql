-- Private staging bucket for untrusted uploads.
-- Objects are written here only with the service role, scanned, then deleted
-- before clean bytes are released to their destination bucket. No browser RLS
-- policy is created for this bucket.

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'upload-quarantine',
  'upload-quarantine',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/webp'
  ]::text[]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
