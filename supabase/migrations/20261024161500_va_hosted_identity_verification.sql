-- Add the minimal server-only verification ledger for hosted VA ID checks.
-- No document image, government ID number, selfie, biometric template, or
-- provider decision JSON is ever stored in this table.
create table if not exists public.va_identity_checks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  provider text not null default 'didit' check (provider = 'didit'),
  session_id uuid unique,
  status text not null default 'initiating'
    check (status in ('initiating','pending','verified','sandbox_approved','needs_review','retry','expired','error')),
  consent_version text not null,
  consented_at timestamptz not null,
  last_started_at timestamptz not null default now(),
  last_event_id uuid,
  last_provider_created_at bigint not null default 0,
  verified_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.va_identity_checks enable row level security;

-- Do not expose this sensitive operational ledger through the public Data API.
-- Only service-role code may read or change it. User views are server rendered
-- after verified authentication and role checks.
revoke all on table public.va_identity_checks from PUBLIC;
revoke all on table public.va_identity_checks from anon, authenticated;
grant select, insert, update, delete on table public.va_identity_checks to service_role;

comment on table public.va_identity_checks is
  'Server-only hosted ID verification ledger. Raw documents and biometrics stay with the external processor.';
comment on column public.va_identity_checks.session_id is
  'Provider-issued opaque session UUID, not a document number or access token.';
