create table if not exists public.email_suppressions (
  email text primary key,
  reason text not null,
  provider_id text,
  suppressed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
revoke all on public.email_suppressions from anon, authenticated;
