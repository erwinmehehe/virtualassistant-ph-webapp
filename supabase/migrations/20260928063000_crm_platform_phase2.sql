-- CRM platform phase 2: first-class companies/contacts, custom fields,
-- saved views, workflow automations, and dashboard preferences.

create table if not exists public.crm_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null,
  website text,
  industry text,
  location text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_companies_normalized_name_key unique (normalized_name)
);

create index if not exists crm_companies_owner_idx on public.crm_companies(owner_id);
create index if not exists crm_companies_name_idx on public.crm_companies(name);

create table if not exists public.crm_contacts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid unique references public.lead_intake(id) on delete cascade,
  client_id uuid references public.profiles(id) on delete set null,
  company_id uuid references public.crm_companies(id) on delete set null,
  full_name text,
  email text,
  phone text,
  title text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_contacts_company_idx on public.crm_contacts(company_id);
create index if not exists crm_contacts_owner_idx on public.crm_contacts(owner_id);
create index if not exists crm_contacts_email_lower_idx on public.crm_contacts(lower(email));

alter table public.lead_intake
  add column if not exists crm_company_id uuid references public.crm_companies(id) on delete set null,
  add column if not exists crm_contact_id uuid references public.crm_contacts(id) on delete set null;

create index if not exists lead_intake_crm_company_idx on public.lead_intake(crm_company_id);
create index if not exists lead_intake_crm_contact_idx on public.lead_intake(crm_contact_id);

create table if not exists public.crm_custom_fields (
  id uuid primary key default gen_random_uuid(),
  object_type text not null check (object_type in ('lead','company','contact')),
  field_key text not null,
  label text not null,
  field_type text not null check (field_type in ('text','number','date','boolean','select')),
  options jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_custom_fields_object_key unique (object_type, field_key)
);

create table if not exists public.crm_custom_values (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null references public.crm_custom_fields(id) on delete cascade,
  object_type text not null check (object_type in ('lead','company','contact')),
  object_id uuid not null,
  value jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_custom_values_field_object unique (field_id, object_id)
);

create index if not exists crm_custom_values_object_idx
  on public.crm_custom_values(object_type, object_id);

create table if not exists public.crm_saved_views (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  object_type text not null default 'lead' check (object_type in ('lead','company','contact')),
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  columns jsonb not null default '[]'::jsonb,
  sort jsonb not null default '{}'::jsonb,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint crm_saved_views_user_name unique (user_id, object_type, name)
);

create index if not exists crm_saved_views_user_idx
  on public.crm_saved_views(user_id, object_type, updated_at desc);

create table if not exists public.crm_workflows (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  trigger_stage text not null,
  action_type text not null check (action_type in ('create_task','set_follow_up')),
  action_config jsonb not null default '{}'::jsonb,
  is_enabled boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_workflows_trigger_idx
  on public.crm_workflows(trigger_stage, is_enabled);

create table if not exists public.crm_dashboard_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  widgets jsonb not null default '["active","needs_action","discovery","qualified","pipeline_value"]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.crm_companies enable row level security;
alter table public.crm_contacts enable row level security;
alter table public.crm_custom_fields enable row level security;
alter table public.crm_custom_values enable row level security;
alter table public.crm_saved_views enable row level security;
alter table public.crm_workflows enable row level security;
alter table public.crm_dashboard_preferences enable row level security;

-- CRM access is intentionally server-side through the service role after
-- recruiter/admin authorization. No browser-facing table policies are created.

create or replace function public.crm_normalize_company_name(value text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(lower(regexp_replace(trim(coalesce(value, '')), '\s+', ' ', 'g')), '');
$$;

create or replace function public.sync_crm_identity_from_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_contact_id uuid;
  v_normalized text;
begin
  if new.lead_type <> 'client_hiring' then
    return new;
  end if;

  v_normalized := public.crm_normalize_company_name(new.company);

  if v_normalized is not null then
    insert into public.crm_companies(name, normalized_name, owner_id)
    values (trim(new.company), v_normalized, new.owner_id)
    on conflict (normalized_name) do update
      set name = excluded.name,
          owner_id = coalesce(public.crm_companies.owner_id, excluded.owner_id),
          updated_at = now()
    returning id into v_company_id;
  else
    v_company_id := null;
  end if;

  insert into public.crm_contacts(
    lead_id, client_id, company_id, full_name, email, phone, owner_id
  )
  values (
    new.id, new.client_id, v_company_id, new.name, new.email, new.phone, new.owner_id
  )
  on conflict (lead_id) do update
    set client_id = excluded.client_id,
        company_id = excluded.company_id,
        full_name = excluded.full_name,
        email = excluded.email,
        phone = excluded.phone,
        owner_id = excluded.owner_id,
        updated_at = now()
  returning id into v_contact_id;

  update public.lead_intake
  set crm_company_id = v_company_id,
      crm_contact_id = v_contact_id
  where id = new.id
    and (
      crm_company_id is distinct from v_company_id
      or crm_contact_id is distinct from v_contact_id
    );

  return new;
end;
$$;

drop trigger if exists lead_intake_sync_crm_identity on public.lead_intake;
create trigger lead_intake_sync_crm_identity
after insert or update of name, email, phone, company, client_id, owner_id
on public.lead_intake
for each row execute function public.sync_crm_identity_from_lead();

-- Backfill first-class company records from existing hiring enquiries.
insert into public.crm_companies(name, normalized_name, owner_id)
select company_name, normalized_name, owner_id
from (
  select distinct on (public.crm_normalize_company_name(company))
    trim(company) as company_name,
    public.crm_normalize_company_name(company) as normalized_name,
    owner_id,
    created_at
  from public.lead_intake
  where lead_type = 'client_hiring'
    and public.crm_normalize_company_name(company) is not null
  order by public.crm_normalize_company_name(company), created_at desc
) source
on conflict (normalized_name) do update
  set name = excluded.name,
      owner_id = coalesce(public.crm_companies.owner_id, excluded.owner_id),
      updated_at = now();

insert into public.crm_contacts(lead_id, client_id, company_id, full_name, email, phone, owner_id)
select
  lead.id,
  lead.client_id,
  company.id,
  lead.name,
  lead.email,
  lead.phone,
  lead.owner_id
from public.lead_intake lead
left join public.crm_companies company
  on company.normalized_name = public.crm_normalize_company_name(lead.company)
where lead.lead_type = 'client_hiring'
on conflict (lead_id) do update
  set client_id = excluded.client_id,
      company_id = excluded.company_id,
      full_name = excluded.full_name,
      email = excluded.email,
      phone = excluded.phone,
      owner_id = excluded.owner_id,
      updated_at = now();

update public.lead_intake lead
set crm_company_id = contact.company_id,
    crm_contact_id = contact.id
from public.crm_contacts contact
where contact.lead_id = lead.id
  and lead.lead_type = 'client_hiring'
  and (
    lead.crm_company_id is distinct from contact.company_id
    or lead.crm_contact_id is distinct from contact.id
  );

revoke all on function public.crm_normalize_company_name(text) from public;
revoke all on function public.sync_crm_identity_from_lead() from public;
grant execute on function public.crm_normalize_company_name(text) to service_role;
