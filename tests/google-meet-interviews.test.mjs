import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("candidate interviews use Google Meet rather than Zoom", async () => {
  const [actions, clientPage, vaPage, migration] = await Promise.all([
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/workspace/client/interviews/page.tsx"),
    read("src/app/workspace/va/interviews/page.tsx"),
    read("supabase/migrations/20260918143000_google_meet_discovery_booking.sql"),
  ]);

  assert.match(actions, /createGoogleMeetDiscoveryMeeting/);
  assert.match(actions, /updateGoogleMeetDiscoveryMeeting/);
  assert.match(actions, /cancelGoogleMeetDiscoveryMeeting/);
  assert.match(actions, /calendar_event_id: meet\.eventId/);
  assert.match(actions, /meeting_provider: "google_meet"/);
  assert.match(clientPage, /Join Google Meet/);
  assert.match(vaPage, /Join Google Meet/);
  assert.doesNotMatch(clientPage, /Join Zoom|join Zoom/);
  assert.doesNotMatch(vaPage, /Join Zoom|Zoom links/);
  assert.match(migration, /candidate_interviews/);
  assert.match(migration, /calendar_event_id/);
  assert.match(migration, /Google Meet link/);
});
