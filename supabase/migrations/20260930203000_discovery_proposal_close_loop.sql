-- Extend client proposals with the exact recommendation produced by Discovery Workspace.
-- lead_proposals remains server-only; clients access proposals through the tokenized Next.js route.

alter table public.lead_proposals
  add column if not exists responsibilities text[] not null default '{}'::text[],
  add column if not exists required_skills text[] not null default '{}'::text[],
  add column if not exists required_tools text[] not null default '{}'::text[],
  add column if not exists salary_min numeric(12,2),
  add column if not exists salary_max numeric(12,2),
  add column if not exists salary_currency text,
  add column if not exists commercial_note text,
  add column if not exists recommended_start_date date,
  add column if not exists send_count integer not null default 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_salary_range_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_salary_range_check
      check (
        (salary_min is null or salary_min >= 0)
        and (salary_max is null or salary_max >= 0)
        and (salary_min is null or salary_max is null or salary_max >= salary_min)
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_salary_currency_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_salary_currency_check
      check (salary_currency is null or salary_currency in ('PHP','AUD','USD'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid='public.lead_proposals'::regclass
      and conname='lead_proposals_send_count_check'
  ) then
    alter table public.lead_proposals
      add constraint lead_proposals_send_count_check
      check (send_count >= 0);
  end if;
end $$;

alter table public.lead_proposals enable row level security;
revoke all on table public.lead_proposals from anon, authenticated;
grant select, insert, update, delete on table public.lead_proposals to service_role;
