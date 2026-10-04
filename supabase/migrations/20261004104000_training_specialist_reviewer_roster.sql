-- Persistent admin-only roster for reusable specialist training reviewers.

create table if not exists public.training_specialist_reviewers (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  email text not null,
  role text not null check (char_length(trim(role)) between 3 and 180),
  domains text[] not null default '{}'::text[],
  qualification_notes text,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint training_specialist_reviewers_email_lower_unique unique (email),
  constraint training_specialist_reviewers_domains_check check (
    cardinality(domains) > 0
    and domains <@ array['Healthcare','Finance','Property','Software']::text[]
  )
);

alter table public.training_specialist_reviewers enable row level security;

revoke all on public.training_specialist_reviewers from anon, authenticated, public;
grant select, insert, update on public.training_specialist_reviewers to service_role;

create index if not exists training_specialist_reviewers_active_idx
  on public.training_specialist_reviewers(is_active, name);

create index if not exists training_specialist_reviewers_domains_gin_idx
  on public.training_specialist_reviewers using gin(domains);
