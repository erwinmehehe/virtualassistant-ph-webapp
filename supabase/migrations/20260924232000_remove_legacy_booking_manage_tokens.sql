-- Run after the signed-capability runtime is deployed.
-- Erase legacy raw booking links and enforce hash-only storage going forward.

update public.lead_intake
set discovery_manage_token = null
where discovery_manage_token is not null;

alter table public.lead_intake
  drop constraint if exists lead_intake_discovery_manage_token_not_stored;

alter table public.lead_intake
  add constraint lead_intake_discovery_manage_token_not_stored
  check (discovery_manage_token is null)
  not valid;

alter table public.lead_intake
  validate constraint lead_intake_discovery_manage_token_not_stored;
