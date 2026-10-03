create or replace function private.enforce_paid_candidate_access()
returns trigger
language plpgsql
set search_path = ''
as $function$
declare
  referenced_payment public.payments%rowtype;
  job_client uuid;
begin
  if new.access_status <> 'paid' then
    return new;
  end if;

  if new.access_fee is null or new.access_fee <= 0 then
    raise exception 'paid candidate access requires a positive access fee';
  end if;

  if new.payment_reference is null
     or new.payment_reference !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'paid candidate access requires a settled VAPH payment id';
  end if;

  select client_id into job_client
  from public.jobs
  where id = new.job_id;

  if job_client is null then
    raise exception 'paid candidate access requires a linked client';
  end if;

  select * into referenced_payment
  from public.payments
  where id = new.payment_reference::uuid
    and job_id = new.job_id
    and client_id = job_client
    and status in ('paid','released')
    and paid_at is not null
  limit 1;

  if referenced_payment.id is null then
    raise exception 'candidate access payment is not settled for this job and client';
  end if;

  if referenced_payment.amount_total < new.access_fee then
    raise exception 'candidate access payment does not cover the access fee';
  end if;

  return new;
end;
$function$;

revoke execute on function private.enforce_paid_candidate_access() from public, anon, authenticated;
grant execute on function private.enforce_paid_candidate_access() to service_role;

drop trigger if exists enforce_paid_candidate_access on public.job_candidate_access;
create trigger enforce_paid_candidate_access
before insert or update on public.job_candidate_access
for each row execute function private.enforce_paid_candidate_access();
