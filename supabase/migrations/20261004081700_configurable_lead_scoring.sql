alter table public.admin_settings
  add column if not exists lead_scoring_rules jsonb not null
  default '{
    "stagePoints":{"new":18,"contacted":32,"discovery_booked":52,"qualified":68,"terms_sent":80,"shortlist_sent":80,"nurture":30,"won":100,"lost":0},
    "hotThreshold":70,"warmThreshold":40,
    "activeTodayPoints":15,"recent3DaysPoints":10,"recent7DaysPoints":4,
    "stale7Penalty":5,"stale14Penalty":12,
    "budgetLowThreshold":500,"budgetMediumThreshold":1000,"budgetHighThreshold":2000,
    "budgetAnyPoints":2,"budgetLowPoints":4,"budgetMediumPoints":7,"budgetHighPoints":10,
    "agencyValueMediumThreshold":1000,"agencyValueHighThreshold":3000,
    "agencyValueAnyPoints":2,"agencyValueMediumPoints":4,"agencyValueHighPoints":6,
    "discoveryBookedPoints":6,"discoveryCompletedPoints":8,
    "followUpDueSoonPoints":4,"followUpOverdueBasePoints":5,"followUpOverdueMaxPoints":12,
    "firstResponseOverdueMinutes":30,"firstResponseOverduePoints":10
  }'::jsonb;

alter table public.admin_settings
  drop constraint if exists admin_settings_lead_scoring_rules_object;

alter table public.admin_settings
  add constraint admin_settings_lead_scoring_rules_object
  check (jsonb_typeof(lead_scoring_rules) = 'object');

comment on column public.admin_settings.lead_scoring_rules is
  'Admin-controlled recruiter lead scoring thresholds and weights. Application code normalizes missing or malformed keys back to safe defaults.';
