-- v4.10.5: circumvention detection and account bans.
-- Messages are scanned server-side for signs of trying to move payment or
-- contact off-platform (personal contact info, third-party payment apps,
-- "pay me directly" language). Matches are flagged for admin review, not
-- auto-banned -- false positives are common with keyword matching, so a
-- human confirms before anyone loses access. Admin can then ban with one
-- click from the flag.

alter table public.profiles add column if not exists account_status text not null default 'active' check (account_status in ('active', 'banned'));
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists banned_reason text;
alter table public.profiles add column if not exists banned_by uuid references public.profiles(id) on delete set null;

create table if not exists public.message_flags (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  matched_terms text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'dismissed', 'actioned')),
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists message_flags_status_idx on public.message_flags(status, created_at desc);
create index if not exists message_flags_sender_idx on public.message_flags(sender_id, created_at desc);

alter table public.message_flags enable row level security;

-- Staff-only table: flags and the message content behind them should never
-- be readable by the client/VA who triggered them. All reads/writes go
-- through server actions using the service role key.
revoke all on public.message_flags from anon, authenticated;
grant all on public.message_flags to service_role;
