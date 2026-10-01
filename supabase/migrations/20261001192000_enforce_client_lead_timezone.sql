-- Keep client-hiring scheduling timezones machine-readable.
-- Historical form placeholders are not real timezones and should be treated as unknown.
update public.lead_intake
set timezone = null
where lead_type = 'client_hiring'
  and lower(btrim(coalesce(timezone, ''))) in ('to confirm', 'to confirm on discovery call');

create or replace function private.validate_client_hiring_timezone()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  if new.lead_type = 'client_hiring'
     and new.timezone is not null
     and btrim(new.timezone) <> ''
     and not exists (
       select 1
       from pg_catalog.pg_timezone_names tz
       where tz.name = btrim(new.timezone)
     ) then
    raise exception using
      errcode = '22023',
      message = 'client_hiring timezone must be a valid IANA timezone';
  end if;

  if new.lead_type = 'client_hiring' and new.timezone is not null then
    new.timezone := nullif(btrim(new.timezone), '');
  end if;

  return new;
end;
$function$;

drop trigger if exists validate_client_hiring_timezone on public.lead_intake;
create trigger validate_client_hiring_timezone
before insert or update of timezone, lead_type on public.lead_intake
for each row
execute function private.validate_client_hiring_timezone();

revoke execute on function private.validate_client_hiring_timezone() from public, anon, authenticated;
