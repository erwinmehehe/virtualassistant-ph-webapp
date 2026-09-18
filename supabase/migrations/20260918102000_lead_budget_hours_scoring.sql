alter table public.lead_intake
  add column if not exists budget text;

update public.lead_intake
set budget = nullif(
  trim(
    coalesce(
      substring(message from '(?i)Virtual Assistant budget:\\s*([^\\n\\r]+)'),
      substring(message from '(?i)Hourly VA budget:\\s*([^\\n\\r]+)')
    )
  ),
  ''
)
where budget is null
  and message is not null
  and (
    message ~* 'Virtual Assistant budget:'
    or message ~* 'Hourly VA budget:'
  );

comment on column public.lead_intake.budget is
  'Client stated hourly VA budget captured from the hiring brief. Kept separate from estimated agency revenue.';
