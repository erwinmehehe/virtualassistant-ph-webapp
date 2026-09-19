-- Clients who do not warm to the sample profiles on the hiring-form success
-- screen can say why in one tap. Stored on the lead so the recruiter sees the
-- preference before the first call instead of losing a silent bounce.
alter table public.lead_intake add column if not exists match_feedback text[] not null default '{}';
alter table public.lead_intake add column if not exists match_feedback_at timestamptz;

comment on column public.lead_intake.match_feedback is
  'Client-tapped reasons the sampled VA profiles were not a fit (fixed vocabulary, set from the public success screen).';
comment on column public.lead_intake.match_feedback_at is
  'When the client last sent match feedback.';
