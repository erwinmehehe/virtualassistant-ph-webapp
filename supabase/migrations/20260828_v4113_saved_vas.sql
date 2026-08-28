-- v4.11.3: client shortlists / saved VA profiles.
create table if not exists public.saved_vas (
  client_id uuid not null references public.profiles(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (client_id, va_id)
);

alter table public.saved_vas enable row level security;
drop policy if exists "clients own saved vas" on public.saved_vas;
create policy "clients own saved vas" on public.saved_vas for all to authenticated
  using (auth.uid() = client_id)
  with check (auth.uid() = client_id);
create index if not exists saved_vas_client_created_idx on public.saved_vas(client_id, created_at desc);
