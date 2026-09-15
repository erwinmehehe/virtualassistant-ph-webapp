-- Older deployed proposal code may still write shortlist_sent into the Sales CRM.
-- Keep the database backward-compatible while making terms_sent canonical.
create or replace function public.normalize_lead_sales_stage()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.crm_stage='shortlist_sent' then new.crm_stage:='terms_sent'; end if;
  return new;
end; $$;
drop trigger if exists normalize_lead_sales_stage on public.lead_intake;
create trigger normalize_lead_sales_stage
before insert or update of crm_stage on public.lead_intake
for each row execute function public.normalize_lead_sales_stage();
revoke execute on function public.normalize_lead_sales_stage() from public,anon,authenticated;
