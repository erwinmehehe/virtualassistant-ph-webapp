create or replace function public.set_recruiter_notification_priority()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.priority is null or new.priority = 'normal' then
    new.priority := case
      when lower(coalesce(new.title,'') || ' ' || coalesce(new.body,'')) ~ '(overdue|failed|failure|bounced|complained|suppressed|sla)' then 'urgent'
      when lower(coalesce(new.title,'') || ' ' || coalesce(new.body,'')) ~ '(new client|proposal|discovery|booking|application|shortlist)' then 'high'
      else coalesce(new.priority, 'normal')
    end;
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_recruiter_priority on public.notifications;
create trigger notifications_recruiter_priority
before insert on public.notifications
for each row execute function public.set_recruiter_notification_priority();

revoke all on function public.set_recruiter_notification_priority() from public, anon, authenticated;
