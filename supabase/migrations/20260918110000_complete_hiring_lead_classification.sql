create or replace function public.classify_lead_type()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
  if new.source_page in (
    'content_role_brief',
    'public_role_brief',
    'service_match_request',
    'industry_match_request',
    'blog_match_request',
    'talent_shortlist_request',
    'talent_introduction_request',
    'client_discovery_booking'
  ) then
    new.lead_type := 'client_hiring';
  elsif new.lead_type is null
     or (
       tg_op = 'UPDATE'
       and (new.source_page is distinct from old.source_page or new.service is distinct from old.service)
       and new.lead_type = old.lead_type
     ) then
    new.lead_type := case
      when lower(coalesce(new.service,'')) like '%virtual assistant account%' then 'va_support'
      when lower(coalesce(new.service,'')) like '%privacy%'
        or lower(coalesce(new.service,'')) like '%data request%' then 'privacy'
      when lower(coalesce(new.service,'')) like '%client account support%' then 'client_support'
      else 'general'
    end;
  end if;
  return new;
end;
$function$;

create or replace function public.assign_lead_owner()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  if (
      new.lead_type = 'client_hiring'
      or new.source_page in (
        'content_role_brief',
        'public_role_brief',
        'service_match_request',
        'industry_match_request',
        'blog_match_request',
        'talent_shortlist_request',
        'talent_introduction_request',
        'client_discovery_booking'
      )
    )
    and new.owner_id is null
    and coalesce(new.crm_stage,'new') not in ('won','lost') then
    new.owner_id := public.default_recruiter_id();
  end if;
  return new;
end;
$function$;

update public.lead_intake l
set lead_type = 'client_hiring',
    owner_id = coalesce(
      l.owner_id,
      (select j.recruiter_id from public.jobs j where j.id = l.job_id),
      public.default_recruiter_id()
    )
where l.source_page in (
    'content_role_brief',
    'public_role_brief',
    'service_match_request',
    'industry_match_request',
    'blog_match_request',
    'talent_shortlist_request',
    'talent_introduction_request',
    'client_discovery_booking'
  )
  and (
    coalesce(l.lead_type,'general') <> 'client_hiring'
    or (
      l.owner_id is null
      and coalesce(l.crm_stage,'new') not in ('won','lost')
    )
  );
