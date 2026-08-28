-- v4.11.1: track when an unlinked lead was last emailed to come claim their
-- draft job and create a client account. Without this, a lead who submits a
-- role brief anonymously and doesn't sign up in the same session never
-- hears from us again -- their draft (and any released shortlist) just sits
-- stuck with no client_id forever, unable to receive a released shortlist
-- notification or use the workspace at all.
alter table public.lead_intake add column if not exists nudged_at timestamptz;
