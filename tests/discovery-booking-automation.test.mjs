import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("discovery reminders have a frequent Supabase scheduler independent of the daily Vercel cron", async () => {
  const [route, migration, vercel] = await Promise.all([
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("supabase/migrations/20260916023000_discovery_reminder_scheduler.sql"),
    read("vercel.json"),
  ]);

  assert.match(vercel, /0 9 \* \* \*/);
  assert.match(migration, /discovery-reminder-sweep/);
  assert.match(migration, /\*\/15 \* \* \* \*/);
  assert.match(migration, /vault\.create_secret/);
  assert.match(migration, /verify_discovery_reminder_cron_token/);
  assert.match(route, /x-discovery-cron-token/);
  assert.match(route, /minutesUntil >= 30 && minutesUntil <= 90/);
  assert.match(route, /minutesUntil >= 23 \* 60 && minutesUntil <= 25 \* 60/);
});

test("rescheduling only retires the previous Zoom meeting after the replacement is saved", async () => {
  const action = await read("src/app/actions/booking.ts");

  assert.match(action, /discovery_meeting_url: zoom\.joinUrl \|\| previousMeetingUrl \|\| null/);
  assert.match(action, /discovery_zoom_meeting_id: zoom\.meetingId \|\| previousMeetingId \|\| null/);
  assert.match(action, /best-effort cleanup of the unsaved replacement meeting/);

  const createIndex = action.indexOf("createZoomDiscoveryMeeting({");
  const saveIndex = action.indexOf('admin.from("lead_intake").update(update)');
  const retireIndex = action.indexOf("cancelZoomDiscoveryMeeting(previousMeetingId)");
  assert.ok(createIndex >= 0 && saveIndex > createIndex && retireIndex > saveIndex);
});
