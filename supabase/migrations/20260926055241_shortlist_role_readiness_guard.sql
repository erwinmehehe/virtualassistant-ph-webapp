create or replace function public.enforce_client_visible_shortlist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.shortlist_status='released'
     and (tg_op='INSERT' or old.shortlist_status is distinct from 'released') then

    if not exists (
      select 1
      from public.jobs j
      where j.id=new.job_id
        and char_length(btrim(coalesce(j.title,''))) >= 3
        and char_length(btrim(coalesce(j.summary,''))) >= 20
        and cardinality(coalesce(j.responsibilities,'{}'::text[])) >= 1
        and cardinality(coalesce(j.required_skills,'{}'::text[])) >= 2
        and j.hours_per_week is not null
        and btrim(coalesce(j.timezone,'')) <> ''
        and j.min_hourly_rate is not null
        and btrim(coalesce(j.start_timing,'')) <> ''
    ) then
      raise exception using
        errcode = '23514',
        message = 'Role brief is incomplete for client shortlist release. Complete the required role details before sending candidates.';
    end if;

    if not exists(
      select 1
      from public.jobs j
      join public.job_commercials c on c.job_id=j.id and c.commercial_status='accepted'
      join public.job_candidate_access a on a.job_id=j.id and a.access_status in ('paid','comped')
      where j.id=new.job_id and j.client_id is not null and j.status='published'
    ) then
      raise exception 'Client review is not ready yet. Link the client and activate the approved service terms before sending the shortlist.';
    end if;
  end if;

  return new;
end;
$$;

revoke all on function public.enforce_client_visible_shortlist() from public, anon, authenticated;
