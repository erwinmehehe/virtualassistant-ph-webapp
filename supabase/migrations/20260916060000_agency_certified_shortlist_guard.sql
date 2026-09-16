-- Keep client presentation aligned with the internal Talent OS definition of
-- client-ready talent. A VA may remain in an internal shortlist while work is
-- still being completed, but a new client release requires current evidence.
--
-- Agency Certified is intentionally deterministic. It is not an AI score and
-- it is not inferred from profile copy. The status requires:
--   * active VA account
--   * approved/bench vetting stage
--   * active talent-pool membership
--   * availability currently marked available and confirmed in the last 30 days
--   * recruiter-verified work setup

create or replace function public.is_va_agency_certified(
  p_va_id uuid,
  p_as_of timestamptz default now()
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    exists (
      select 1
      from public.profiles p
      where p.id = p_va_id
        and p.role = 'va'
        and p.account_status = 'active'
    )
    and exists (
      select 1
      from public.va_vetting vv
      where vv.va_id = p_va_id
        and vv.stage in ('approved', 'bench')
    )
    and exists (
      select 1
      from public.bench_memberships bm
      where bm.va_id = p_va_id
        and bm.status = 'active'
    )
    and exists (
      select 1
      from public.va_profiles v
      where v.user_id = p_va_id
        and v.availability_status = 'available'
        and v.availability_confirmed_at is not null
        and v.availability_confirmed_at >= p_as_of - interval '30 days'
        and v.work_setup_verified_at is not null
    );
$$;

revoke execute on function public.is_va_agency_certified(uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.is_va_agency_certified(uuid, timestamptz) to service_role;

create or replace function public.enforce_agency_certified_shortlist_release()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Internal/proposed shortlist work is intentionally unaffected.
  if new.shortlist_status <> 'released' then
    return new;
  end if;

  -- Do not retroactively hide or break candidates a client already received.
  -- Only the transition into released status is guarded.
  if tg_op = 'UPDATE' and old.shortlist_status = 'released' then
    return new;
  end if;

  if not public.is_va_agency_certified(new.va_id, now()) then
    raise exception using
      errcode = '23514',
      message = 'VA is not Agency Certified for client release. Confirm active talent-pool membership, fresh availability, and verified work setup first.';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_agency_certified_shortlist_release() from public, anon, authenticated;

drop trigger if exists job_shortlist_agency_certified_release_guard on public.job_shortlist_candidates;
create trigger job_shortlist_agency_certified_release_guard
before insert or update of shortlist_status on public.job_shortlist_candidates
for each row execute function public.enforce_agency_certified_shortlist_release();
