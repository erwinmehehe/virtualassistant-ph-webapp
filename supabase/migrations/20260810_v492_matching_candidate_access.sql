-- v4.9.2: staff pre-application matching + paid/comped client candidate access.
-- Candidate identity and private application evidence remain server/staff-only until access is activated.

alter table public.admin_settings
  add column if not exists default_candidate_access_fee numeric(10,2) not null default 0 check (default_candidate_access_fee >= 0);

create table if not exists public.job_candidate_access (
  job_id uuid primary key references public.jobs(id) on delete cascade,
  access_status text not null default 'locked' check (access_status in ('locked','requested','quoted','invoiced','paid','comped')),
  access_fee numeric(10,2) check (access_fee is null or access_fee >= 0),
  currency text not null default 'USD' check (char_length(currency) = 3),
  requested_at timestamptz,
  unlocked_at timestamptz,
  unlocked_by uuid references public.profiles(id) on delete set null,
  payment_reference text,
  notes text,
  updated_at timestamptz not null default now()
);

create table if not exists public.job_shortlist_candidates (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  va_id uuid not null references public.profiles(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  match_confidence integer not null check (match_confidence between 0 and 100),
  shortlist_status text not null default 'proposed' check (shortlist_status in ('proposed','released','hidden')),
  staff_note text,
  created_by uuid references public.profiles(id) on delete set null,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(job_id, va_id)
);

create index if not exists job_shortlist_candidates_job_idx on public.job_shortlist_candidates(job_id, shortlist_status);
create index if not exists job_shortlist_candidates_va_idx on public.job_shortlist_candidates(va_id);

-- Do not break existing hired relationships when the privacy gate is introduced.
-- Any role that already has a confirmed hire/workroom is grandfathered as comped access.
insert into public.job_candidate_access(job_id, access_status, access_fee, currency, unlocked_at, notes)
select distinct a.job_id, 'comped', 0, 'USD', now(), 'Grandfathered during v4.9.2 migration because this role already had a confirmed hire.'
from public.applications a
where a.status = 'hired'
   or exists (select 1 from public.workrooms w where w.job_id = a.job_id)
on conflict (job_id) do nothing;

-- Scrub historical in-app notifications created by older releases so a locked client cannot
-- recover an applicant's identity from notification text after this privacy model is deployed.
update public.notifications
set body = 'A vetted VA submitted an application. Candidate identity remains protected until candidate access is active.'
where title like 'New application for %';

update public.notifications
set title = 'New candidate message',
    body = 'A candidate sent a message. Candidate identity and message content become available when candidate access is active.',
    href = '/workspace/client/jobs'
where href like '/workspace/client/messages?thread=%';

alter table public.job_candidate_access enable row level security;
alter table public.job_shortlist_candidates enable row level security;

-- Clients may see only the commercial/access state for their own job. Shortlist rows stay server-only
-- because exposing va_id would let a locked client correlate protected applicants with public profiles.
drop policy if exists "client candidate access read" on public.job_candidate_access;
create policy "client candidate access read" on public.job_candidate_access for select using (
  exists (select 1 from public.jobs j where j.id = job_id and j.client_id = auth.uid())
);

-- Replace direct client application access with an entitlement check.
drop policy if exists "clients see job applications" on public.applications;
create policy "clients see unlocked job applications" on public.applications for select using (
  exists (
    select 1
    from public.jobs j
    join public.job_candidate_access ca on ca.job_id = j.id
    where j.id = job_id
      and j.client_id = auth.uid()
      and ca.access_status in ('paid','comped')
  )
);

-- Keep VA history access unchanged; gate the client side behind the same entitlement.
drop policy if exists "application participants read status history" on public.application_status_history;
create policy "application participants read status history" on public.application_status_history for select using (
  exists (
    select 1
    from public.applications a
    left join public.jobs j on j.id = a.job_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where a.id = application_id
      and (
        a.va_id = auth.uid()
        or (j.client_id = auth.uid() and ca.access_status in ('paid','comped'))
      )
  )
);

-- Conversations can exist as soon as a VA applies, but clients cannot open them before access is active.
drop policy if exists "conversation participants" on public.conversations;
create policy "conversation participants" on public.conversations for select using (
  auth.uid() = va_id
  or (
    auth.uid() = client_id
    and exists (
      select 1
      from public.applications a
      join public.job_candidate_access ca on ca.job_id = a.job_id
      where a.id = application_id and ca.access_status in ('paid','comped')
    )
  )
);

drop policy if exists "message participants read" on public.messages;
create policy "message participants read" on public.messages for select using (
  exists (
    select 1
    from public.conversations c
    left join public.applications a on a.id = c.application_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where c.id = conversation_id
      and (
        c.va_id = auth.uid()
        or (c.client_id = auth.uid() and ca.access_status in ('paid','comped'))
      )
  )
);

drop policy if exists "message participants send" on public.messages;
create policy "message participants send" on public.messages for insert with check (
  auth.uid() = sender_id
  and exists (
    select 1
    from public.conversations c
    left join public.applications a on a.id = c.application_id
    left join public.job_candidate_access ca on ca.job_id = a.job_id
    where c.id = conversation_id
      and (
        c.va_id = auth.uid()
        or (c.client_id = auth.uid() and ca.access_status in ('paid','comped'))
      )
  )
);

-- Reuse the standard timestamp trigger when available.
drop trigger if exists job_candidate_access_touch on public.job_candidate_access;
create trigger job_candidate_access_touch before update on public.job_candidate_access for each row execute procedure public.touch_updated_at();

drop trigger if exists job_shortlist_candidates_touch on public.job_shortlist_candidates;
create trigger job_shortlist_candidates_touch before update on public.job_shortlist_candidates for each row execute procedure public.touch_updated_at();
