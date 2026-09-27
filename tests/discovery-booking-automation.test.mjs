import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy discovery scheduler is authenticated but the endpoint remains email-silent", async () => {
  const [route, migration, repairMigration, vercel] = await Promise.all([
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("supabase/migrations/20260916023000_discovery_reminder_scheduler.sql"),
    read("supabase/migrations/20260916024500_fix_discovery_reminder_vault_token.sql"),
    read("vercel.json"),
  ]);

  assert.match(vercel, /0 9 \* \* \*/);
  assert.match(migration, /discovery-reminder-sweep/);
  assert.match(migration, /\*\/15 \* \* \* \*/);
  assert.match(migration, /vault\.create_secret/);
  assert.match(migration, /verify_discovery_reminder_cron_token/);
  assert.match(repairMigration, /decrypted_secret = candidate/);
  assert.match(repairMigration, /select decrypted_secret/);
  assert.doesNotMatch(repairMigration, /select secret\s+into scheduler_token/);
  assert.match(route, /x-discovery-cron-token/);
  assert.match(route, /x-discovery-cron-token/);
  assert.match(route, /client_email_shortlist_only/);
  assert.match(route, /suppressed: count \|\| 0/);
  assert.doesNotMatch(route, /sendDiscoveryReminderEmail/);
});

test("rescheduling updates the existing Google Calendar event when one exists", async () => {
  const action = await read("src/app/actions/booking.ts");

  assert.match(action, /previousEventId/);
  assert.match(action, /updateGoogleMeetDiscoveryMeeting/);
  assert.match(action, /const canReuseCalendarEvent = Boolean\(previousEventId && !lead\.discovery_cancelled_at && lead\.discovery_outcome !== "cancelled"\)/);
  assert.match(action, /discovery_meeting_url: meeting\?\.joinUrl \|\| \(canReuseCalendarEvent \? previousMeetingUrl : null\)/);
  assert.match(action, /discovery_calendar_event_id: meeting\?\.eventId \|\| \(canReuseCalendarEvent \? previousEventId : null\)/);
  assert.match(action, /discovery_meeting_provider: meeting \|\| canReuseCalendarEvent \? "google_meet" : null/);

  const updateIndex = action.indexOf("updateGoogleMeetDiscoveryMeeting({");
  const saveIndex = action.indexOf('admin.from("lead_intake").update(update)');
  assert.ok(updateIndex >= 0 && saveIndex > updateIndex);
});
