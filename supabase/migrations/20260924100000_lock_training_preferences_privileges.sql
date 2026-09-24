-- Tighten direct table privileges for learner training preferences.
-- Row ownership is still enforced by RLS; these grants remove unnecessary
-- table-level capabilities from browser roles.

revoke all on public.training_learner_preferences from anon, authenticated;

grant select, insert, update
on public.training_learner_preferences
to authenticated;

grant all
on public.training_learner_preferences
to service_role;
