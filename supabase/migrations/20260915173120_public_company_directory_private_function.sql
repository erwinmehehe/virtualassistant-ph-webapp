-- Match the hardened public-directory pattern already used by VA public views.
-- The exposed view is SECURITY INVOKER; the narrowly scoped data function
-- lives outside the exposed public API schema.

create or replace function private.public_company_profile_rows()
returns table(
  user_id uuid,
  company_name text,
  logo_url text,
  website text,
  industry text,
  location text,
  team_size text,
  company_description text,
  verified_at timestamptz,
  hires_count integer
)
language sql
stable
security definer
set search_path='pg_catalog'
as $$
  select
    c.user_id,
    c.company_name,
    c.logo_url,
    c.website,
    c.industry,
    c.location,
    c.team_size,
    c.company_description,
    c.verified_at,
    (select count(*)::integer from public.workrooms w where w.client_id=c.user_id) as hires_count
  from public.client_profiles c
  where c.public_company_visible=true
    and c.company_name is not null
    and btrim(c.company_name)<>'';
$$;

revoke all on function private.public_company_profile_rows() from public,anon,authenticated;
grant execute on function private.public_company_profile_rows() to anon,authenticated,service_role;

create or replace view public.public_company_profiles
with (security_invoker=true, security_barrier=true)
as select * from private.public_company_profile_rows();

revoke all on public.public_company_profiles from public,anon,authenticated;
grant select on public.public_company_profiles to anon,authenticated;

drop function if exists public.public_company_profile_rows();
