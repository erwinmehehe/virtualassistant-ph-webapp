import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter client replies use atomic deterministic email idempotency", async () => {
  const [actions, email] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(actions, /dailyEmailIdempotencyKey\("client-followup"/);
  assert.match(actions, /activityId,[\s\S]*recipient,[\s\S]*subject,[\s\S]*message,[\s\S]*user\.id/);
  assert.match(actions, /idempotencyKey: followupIdempotencyKey/);
  assert.match(actions, /result\.duplicatePrevented/);
  assert.match(actions, /contact_already_sent=1/);

  assert.match(email, /sendStaffClientFollowupEmail\(args:[\s\S]*idempotencyKey\?: string/);
  assert.match(email, /"client_followup",[\s\S]*idempotencyKey: args\.idempotencyKey/);
  assert.match(email, /duplicatePrevented: delivery\.duplicatePrevented === true/);
});

test("recruiter booking action claims prevent duplicate Google Meet creation", async () => {
  const [actions, migration] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("supabase/migrations/20260924080500_recruiter_action_idempotency.sql"),
  ]);

  assert.match(actions, /formData\.get\("request_id"\)/);
  assert.match(actions, /claimRecruiterAction\(admin, requestId, "schedule_discovery", user\.id, leadId\)/);
  assert.match(actions, /if \(!claimed\)[\s\S]*discovery_already_saved=1/);
  assert.match(actions, /sameActiveBooking/);
  assert.match(actions, /releaseRecruiterAction\(admin, requestId, user\.id\)/);
  assert.match(actions, /completeRecruiterAction\(admin, requestId, user\.id\)/);

  assert.match(migration, /create table if not exists public\.recruiter_action_claims/);
  assert.match(migration, /request_id uuid primary key/);
  assert.match(migration, /revoke all on table public\.recruiter_action_claims from public, anon, authenticated/);
  assert.match(migration, /grant select, insert, update, delete on table public\.recruiter_action_claims to service_role/);
});

test("recruiter booking confirmation is idempotent for the lead and scheduled time", async () => {
  const [actions, email] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(actions, /stableEmailIdempotencyKey\("discovery-booking", \[leadId, scheduledIso\]\)/);
  assert.match(email, /sendDiscoveryBookingEmail\(args:[\s\S]*idempotencyKey\?: string/);
  assert.match(email, /"discovery_booking",[\s\S]*idempotencyKey: args\.idempotencyKey/);
});

test("recruiter reply and booking forms disable while a submit is pending", async () => {
  const [page, button] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/components/pending-submit-button.tsx"),
  ]);

  assert.match(page, /PendingSubmitButton label="Send reply" pendingLabel="Sending…"/);
  assert.match(page, /PendingSubmitButton label="Book and email client" pendingLabel="Booking…"/);
  assert.match(page, /name="request_id" value=\{crypto\.randomUUID\(\)\}/);
  assert.match(page, /contact_already_sent/);
  assert.match(page, /discovery_already_saved/);

  assert.match(button, /useFormStatus/);
  assert.match(button, /disabled=\{pending\}/);
  assert.match(button, /aria-disabled=\{pending\}/);
});


test("historical cancelled discovery rows no longer remain labelled rescheduled", async () => {
  const migration = await read("supabase/migrations/20260924081000_normalize_cancelled_discovery_outcomes.sql");
  assert.match(migration, /set discovery_outcome = 'cancelled'/);
  assert.match(migration, /where discovery_outcome = 'rescheduled'/);
  assert.match(migration, /discovery_cancelled_at is not null/);
  assert.match(migration, /discovery_scheduled_at is null/);
});
