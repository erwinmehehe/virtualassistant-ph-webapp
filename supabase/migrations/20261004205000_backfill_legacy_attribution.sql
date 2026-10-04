-- Deterministic historical attribution backfill.
-- Uses only attribution and source fields already stored on each lead.
update public.lead_intake l
set attribution =
  coalesce(l.attribution,'{}'::jsonb)
  || jsonb_build_object(
    'first_touch_source',
      coalesce(
        nullif(l.attribution ->> 'utm_source',''),
        nullif(l.attribution ->> 'referrer_host',''),
        nullif(l.source_page,''),
        'direct'
      ),
    'first_touch_medium', nullif(l.attribution ->> 'utm_medium',''),
    'first_touch_campaign', nullif(l.attribution ->> 'utm_campaign',''),
    'first_touch_landing_page',
      coalesce(
        nullif(l.attribution ->> 'landing_page',''),
        nullif(l.page_url,''),
        nullif(l.source_page,'')
      ),
    'first_touch_at', l.created_at::text
  )
  || case
    when nullif(l.attribution ->> 'last_touch_source','') is null then
      jsonb_build_object(
        'last_touch_source',
          coalesce(
            nullif(l.attribution ->> 'utm_source',''),
            nullif(l.attribution ->> 'referrer_host',''),
            nullif(l.source_page,''),
            'direct'
          ),
        'last_touch_medium', nullif(l.attribution ->> 'utm_medium',''),
        'last_touch_campaign', nullif(l.attribution ->> 'utm_campaign',''),
        'last_touch_landing_page',
          coalesce(
            nullif(l.attribution ->> 'landing_page',''),
            nullif(l.page_url,''),
            nullif(l.source_page,'')
          ),
        'last_touch_at', l.created_at::text
      )
    else '{}'::jsonb
  end
where l.lead_type='client_hiring'
  and nullif(l.attribution ->> 'first_touch_source','') is null;

comment on trigger preserve_lead_first_touch_attribution_trigger on public.lead_intake
is 'First-touch acquisition keys become immutable after initial capture/backfill; last-touch keys remain updateable.';
