-- v4.11.2: drop admin_settings.application_cc_email -- a leftover column
-- from before lead/application notification recipients moved to env-var
-- config (LEAD_NOTIFICATION_EMAIL, APPLICATION_CC_EMAIL). Confirmed nothing
-- in the codebase reads this column; it just held a stale email address
-- with no way to be nulled out (NOT NULL constraint) or safely edited from
-- the admin UI. Removing it rather than leaving unused, confusing schema.
alter table public.admin_settings drop column if exists application_cc_email;
