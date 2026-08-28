-- v4.13.3: make the admin analytics screen cheap to load.
--
-- The page filters analytics_events and lead_intake by created_at, but every
-- existing index leads with event_name or session_id, so both queries were
-- sequential scans over the whole table followed by a sort. It then shipped up
-- to 10k rows (including the metadata jsonb) to the app to be counted in JS.

create index if not exists analytics_events_created_idx on public.analytics_events(created_at desc);
create index if not exists lead_intake_created_idx on public.lead_intake(created_at desc);

-- Aggregate in the database instead of transferring rows. Service-role only:
-- security definer plus a revoke, matching how the admin screens already read
-- through the service client.
create or replace function public.admin_analytics_summary(p_since timestamptz)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'event_counts', coalesce((
      select json_agg(json_build_object('event_name', t.event_name, 'total', t.total))
      from (
        select event_name, count(*) as total
        from public.analytics_events
        where created_at >= p_since
        group by event_name
      ) t
    ), '[]'::json),
    'sessions', (
      select count(distinct session_id)
      from public.analytics_events
      where created_at >= p_since and session_id is not null
    ),
    'client_accounts', (
      select count(*)
      from public.analytics_events
      where created_at >= p_since
        and event_name = 'account_created'
        and metadata->>'role' = 'client'
    ),
    'role_briefs', (
      select count(*)
      from public.lead_intake
      where created_at >= p_since
        and source_page in ('public_role_brief', 'talent_introduction_request')
    ),
    'intro_briefs', (
      select count(*)
      from public.lead_intake
      where created_at >= p_since and source_page = 'talent_introduction_request'
    ),
    'converted_leads', (
      select count(*)
      from public.lead_intake
      where created_at >= p_since and status = 'converted'
    )
  );
$$;

revoke all on function public.admin_analytics_summary(timestamptz) from anon, authenticated;
