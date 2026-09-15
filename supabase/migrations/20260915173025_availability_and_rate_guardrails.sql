-- Keep the configured commercial floor and VA availability freshness reliable
-- even when an older form or server action has not yet been updated.

create or replace function public.guard_configured_minimum_rate()
returns trigger
language plpgsql
set search_path=public
as $$
declare v_min numeric; begin
  select min_hourly_rate into v_min from admin_settings where id=1;
  v_min:=coalesce(v_min,5);

  if tg_table_name='va_profiles' then
    if new.hourly_rate is not null and new.hourly_rate<v_min then
      raise exception 'Hourly rate must be at least USD %.',v_min;
    end if;
  elsif tg_table_name='jobs' then
    if new.min_hourly_rate is not null and new.min_hourly_rate<v_min then
      raise exception 'Role budget must be at least USD % per hour.',v_min;
    end if;
    if new.max_hourly_rate is not null and new.min_hourly_rate is not null and new.max_hourly_rate<new.min_hourly_rate then
      raise exception 'Maximum hourly rate cannot be lower than the minimum hourly rate.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists va_profile_minimum_rate_guard on public.va_profiles;
create trigger va_profile_minimum_rate_guard
before insert or update of hourly_rate on public.va_profiles
for each row execute function public.guard_configured_minimum_rate();

drop trigger if exists job_minimum_rate_guard on public.jobs;
create trigger job_minimum_rate_guard
before insert or update of min_hourly_rate,max_hourly_rate on public.jobs
for each row execute function public.guard_configured_minimum_rate();

-- Any material change to availability makes the old confirmation stale. The VA
-- confirms the new values themselves after saving.
create or replace function public.invalidate_va_availability_confirmation()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if tg_op='UPDATE' and (
    new.availability_status is distinct from old.availability_status or
    new.weekly_hours is distinct from old.weekly_hours or
    new.schedule is distinct from old.schedule or
    new.hourly_rate is distinct from old.hourly_rate
  ) then
    new.availability_confirmed_at:=null;
  end if;
  return new;
end;
$$;

drop trigger if exists va_availability_confirmation_invalidate on public.va_profiles;
create trigger va_availability_confirmation_invalidate
before update of availability_status,weekly_hours,schedule,hourly_rate on public.va_profiles
for each row execute function public.invalidate_va_availability_confirmation();

revoke execute on function public.guard_configured_minimum_rate() from public,anon,authenticated;
revoke execute on function public.invalidate_va_availability_confirmation() from public,anon,authenticated;
