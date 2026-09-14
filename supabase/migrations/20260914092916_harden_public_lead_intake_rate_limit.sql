create index if not exists lead_intake_email_created_rate_idx
  on public.lead_intake (lower(email), created_at desc);

create or replace function public.guard_public_lead_intake_rate_limit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
declare
  recent_count integer;
  normalized_email text;
begin
  normalized_email := lower(btrim(new.email));

  if normalized_email = '' or coalesce(new.source_page, '') not in (
    'service_match_request',
    'blog_match_request',
    'industry_match_request',
    'public_role_brief',
    'talent_shortlist_request',
    'talent_introduction_request',
    'contact',
    'client_discovery_booking'
  ) then
    return new;
  end if;

  -- Serialize rapid submissions for the same email so concurrent serverless
  -- requests cannot all pass the count check at once.
  perform pg_advisory_xact_lock(hashtextextended(normalized_email, 0));

  select count(*)::integer
    into recent_count
    from public.lead_intake
   where lower(email) = normalized_email
     and created_at >= now() - interval '10 minutes';

  if recent_count >= 8 then
    raise exception using
      errcode = 'P0001',
      message = 'Too many recent hiring requests. Please wait a few minutes and try again.';
  end if;

  return new;
end;
$$;

revoke all on function public.guard_public_lead_intake_rate_limit() from public, anon, authenticated;

drop trigger if exists lead_intake_public_rate_limit_guard on public.lead_intake;
create trigger lead_intake_public_rate_limit_guard
before insert on public.lead_intake
for each row execute function public.guard_public_lead_intake_rate_limit();
