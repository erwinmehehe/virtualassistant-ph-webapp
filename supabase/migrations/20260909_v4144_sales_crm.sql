-- v4.14.4 sales CRM
-- Adds a recruiter-owned sales pipeline without changing the legacy lead
-- status contract used by intake, attribution, and older admin tooling.

alter table public.lead_intake
  add column if not exists crm_stage text,
  add column if not exists owner_id uuid,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists estimated_value_usd numeric(12,2),
  add column if not exists lost_reason text,
  add column if not exists first_contact_at timestamptz,
  add column if not exists last_contact_at timestamptz,
  add column if not exists stage_updated_at timestamptz,
  add column if not exists won_at timestamptz,
  add column if not exists lost_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.lead_intake'::regclass
      and conname = 'lead_intake_crm_stage_check'
  ) then
    alter table public.lead_intake
      add constraint lead_intake_crm_stage_check
      check (crm_stage in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture','won','lost'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.lead_intake'::regclass
      and conname = 'lead_intake_owner_id_fkey'
  ) then
    alter table public.lead_intake
      add constraint lead_intake_owner_id_fkey
      foreign key (owner_id) references public.profiles(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.lead_intake'::regclass
      and conname = 'lead_intake_estimated_value_check'
  ) then
    alter table public.lead_intake
      add constraint lead_intake_estimated_value_check
      check (estimated_value_usd is null or estimated_value_usd >= 0);
  end if;
end $$;

with contact_rollup as (
  select
    subject_id,
    min(created_at) as first_contact_at,
    max(created_at) as last_contact_at
  from public.recruiter_activity
  where subject_type = 'lead'
    and (action like 'client_contact_%' or action = 'client_followup_sent')
  group by subject_id
)
update public.lead_intake l
set
  first_contact_at = coalesce(l.first_contact_at, r.first_contact_at),
  last_contact_at = coalesce(l.last_contact_at, r.last_contact_at)
from contact_rollup r
where l.id = r.subject_id;

with last_owner as (
  select subject_id, actor_id
  from (
    select
      a.subject_id,
      a.actor_id,
      row_number() over (partition by a.subject_id order by a.created_at desc) as rn
    from public.recruiter_activity a
    join public.profiles p on p.id = a.actor_id
    where a.subject_type = 'lead'
      and (a.action like 'client_contact_%' or a.action = 'client_followup_sent')
      and p.role in ('recruiter','admin')
  ) ranked
  where rn = 1
)
update public.lead_intake l
set owner_id = o.actor_id
from last_owner o
where l.id = o.subject_id
  and l.owner_id is null;

update public.lead_intake
set
  crm_stage = case
    when status = 'converted' then 'qualified'
    when status = 'archived' then 'lost'
    when first_contact_at is not null then 'contacted'
    else 'new'
  end
where crm_stage is null;

update public.lead_intake
set
  stage_updated_at = coalesce(stage_updated_at, last_contact_at, created_at, now()),
  lost_at = case when crm_stage = 'lost' then coalesce(lost_at, stage_updated_at, created_at, now()) else lost_at end
where stage_updated_at is null
   or (crm_stage = 'lost' and lost_at is null);

alter table public.lead_intake
  alter column crm_stage set default 'new',
  alter column crm_stage set not null,
  alter column stage_updated_at set default now();

create index if not exists lead_intake_crm_stage_idx
  on public.lead_intake (crm_stage, created_at desc);

create index if not exists lead_intake_follow_up_idx
  on public.lead_intake (next_follow_up_at)
  where next_follow_up_at is not null;

create index if not exists lead_intake_owner_idx
  on public.lead_intake (owner_id, crm_stage);
