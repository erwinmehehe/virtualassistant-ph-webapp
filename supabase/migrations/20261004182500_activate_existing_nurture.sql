-- Enroll existing Nurture-stage leads into the new email-only nurture engine.
-- Intentionally does not enroll historical Lost leads; older losses should not
-- receive unexpected win-back email without a fresh recruiter decision.

create table if not exists public.lead_nurture_state (
  lead_id uuid primary key references public.lead_intake(id) on delete cascade,
  sequence text not null check (sequence in ('nurture','winback')),
  status text not null default 'active' check (status in ('active','paused','unsubscribed','completed')),
  step integer not null default 0 check (step >= 0 and step <= 3),
  next_send_at timestamptz,
  last_sent_at timestamptz,
  last_event text,
  paused_reason text,
  unsubscribe_token uuid not null default gen_random_uuid() unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.lead_nurture_state (
  lead_id,
  sequence,
  status,
  step,
  next_send_at,
  last_event,
  paused_reason
)
select
  l.id,
  'nurture',
  'active',
  0,
  now() + interval '14 days',
  'migration_catchup',
  null
from public.lead_intake l
where l.lead_type = 'client_hiring'
  and l.crm_stage = 'nurture'
  and l.status <> 'spam'
  and coalesce(trim(l.email), '') <> ''
  and not exists (
    select 1
    from public.lead_nurture_state s
    where s.lead_id = l.id
  )
on conflict (lead_id) do nothing;
