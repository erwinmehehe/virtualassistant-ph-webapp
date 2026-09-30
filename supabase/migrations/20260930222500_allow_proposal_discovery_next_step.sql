-- Allow Discovery Workspace to hand a qualified call into the proposal/recommendation step.
-- The application has supported intent="proposal" since PR #700; keep the DB constraint aligned.

alter table public.lead_discovery_briefs
  drop constraint if exists lead_discovery_briefs_next_step_check;

alter table public.lead_discovery_briefs
  add constraint lead_discovery_briefs_next_step_check
  check (next_step is null or next_step in ('proposal','qualified','follow_up','nurture'));
