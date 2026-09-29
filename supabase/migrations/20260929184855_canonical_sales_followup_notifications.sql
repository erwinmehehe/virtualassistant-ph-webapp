create or replace function private.resolve_sales_followup_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  if new.next_follow_up_at is null
     or new.next_follow_up_at > now()
     or coalesce(new.crm_stage, 'new') not in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture') then
    update public.notifications
       set done_at = coalesce(done_at, now()),
           read_at = coalesce(read_at, now()),
           snoozed_until = null
     where done_at is null
       and type = 'sales_follow_up'
       and href = '/workspace/recruiter/crm/' || new.id::text;
  end if;
  return new;
end;
$function$;

drop trigger if exists resolve_sales_followup_notifications on public.lead_intake;
create trigger resolve_sales_followup_notifications
after update of next_follow_up_at, crm_stage on public.lead_intake
for each row
execute function private.resolve_sales_followup_notifications();

revoke execute on function private.resolve_sales_followup_notifications() from public, anon, authenticated;

update public.notifications
   set done_at = coalesce(done_at, now()),
       read_at = coalesce(read_at, now()),
       snoozed_until = null
 where done_at is null
   and href = '/workspace/recruiter/leads?view=attention'
   and title in ('New client request', 'Lead response due in 10 minutes', '30-minute response target missed');

with matches as (
  select
    n.id as notification_id,
    min(l.id::text)::uuid as lead_id,
    count(*) as match_count
  from public.notifications n
  join public.lead_intake l
    on n.title = 'Sales follow-up due: ' || coalesce(nullif(l.company,''), nullif(l.name,''), 'client lead')
   and l.crm_stage in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
   and l.next_follow_up_at is not null
   and l.next_follow_up_at <= now()
   and l.next_follow_up_at >= now() - interval '14 days'
   and (
     l.owner_id = n.user_id
     or (
       l.owner_id is null
       and exists (
         select 1
         from public.profiles p
         where p.id = n.user_id
           and p.role in ('recruiter','admin')
           and p.account_status = 'active'
       )
     )
   )
  where n.done_at is null
    and n.href = '/workspace/recruiter/leads?view=attention'
    and n.title like 'Sales follow-up due:%'
  group by n.id
)
update public.notifications n
   set href = '/workspace/recruiter/crm/' || m.lead_id::text,
       type = 'sales_follow_up'
  from matches m
 where n.id = m.notification_id
   and m.match_count = 1;

update public.notifications n
   set done_at = coalesce(n.done_at, now()),
       read_at = coalesce(n.read_at, now()),
       snoozed_until = null
 where n.done_at is null
   and n.href = '/workspace/recruiter/leads?view=attention'
   and n.title like 'Sales follow-up due:%'
   and not exists (
     select 1
     from public.lead_intake l
     where l.crm_stage in ('new','contacted','discovery_booked','qualified','shortlist_sent','nurture')
       and l.next_follow_up_at is not null
       and l.next_follow_up_at <= now()
       and l.next_follow_up_at >= now() - interval '14 days'
       and n.title = 'Sales follow-up due: ' || coalesce(nullif(l.company,''), nullif(l.name,''), 'client lead')
       and (
         l.owner_id = n.user_id
         or (
           l.owner_id is null
           and exists (
             select 1
             from public.profiles p
             where p.id = n.user_id
               and p.role in ('recruiter','admin')
               and p.account_status = 'active'
           )
         )
       )
   );
