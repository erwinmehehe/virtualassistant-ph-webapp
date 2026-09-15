create or replace function public.create_approved_time_invoice(p_workroom_id uuid,p_description text,p_created_by uuid)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_workroom workrooms%rowtype;
  v_rate numeric;
  v_hours numeric;
  v_payment_id uuid;
  v_description text;
begin
  select * into v_workroom from workrooms where id=p_workroom_id and status='active';
  if not found then raise exception 'Active workroom not found.'; end if;
  select coalesce(v_workroom.agreed_hourly_rate,j.min_hourly_rate) into v_rate from jobs j where j.id=v_workroom.job_id;
  if v_rate is null or v_rate<=0 then raise exception 'No valid agreed hourly rate is recorded for this workroom.'; end if;
  perform 1 from time_entries where workroom_id=p_workroom_id and status='approved' and payment_id is null for update;
  select coalesce(sum(hours),0) into v_hours from time_entries where workroom_id=p_workroom_id and status='approved' and payment_id is null;
  if v_hours<=0 then raise exception 'No approved, uninvoiced time is available.'; end if;
  v_description:=coalesce(nullif(btrim(p_description),''),'Approved VA time');
  insert into payments(workroom_id,job_id,client_id,va_id,description,amount_total,platform_cut_percent,status,created_by)
  values(v_workroom.id,v_workroom.job_id,v_workroom.client_id,v_workroom.va_id,v_description,round(v_hours*v_rate,2),0,'awaiting_payment',p_created_by)
  returning id into v_payment_id;
  update time_entries set payment_id=v_payment_id,updated_at=now()
  where workroom_id=p_workroom_id and status='approved' and payment_id is null;
  return v_payment_id;
end;
$$;
revoke execute on function public.create_approved_time_invoice(uuid,text,uuid) from public,anon,authenticated;
grant execute on function public.create_approved_time_invoice(uuid,text,uuid) to service_role;
