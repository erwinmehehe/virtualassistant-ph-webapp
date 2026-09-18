import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("public discovery booking persists automatic Google Meet links or records setup failure",async()=>{
  const [action,ops,email]=await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/booking-operations.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.match(ops,/Google Meet integration is not configured\. Missing/);
  assert.match(ops,/conferenceDataVersion=1/);
  assert.match(ops,/hangoutsMeet/);
  assert.match(action,/meetingError/);
  assert.match(action,/discovery_meeting_url: meeting\?\.joinUrl \|\| null/);
  assert.match(action,/discovery_calendar_event_id: meeting\?\.eventId \|\| null/);
  assert.match(action,/discovery_meeting_provider: meeting \? "google_meet" : null/);
  assert.match(action,/Automatic Google Meet setup failed:/);
  assert.match(action,/sendDiscoveryMeetingSetupFailureEmail/);
  assert.match(action,/cancelGoogleMeetDiscoveryMeeting\(meeting\.eventId\)/);
  assert.match(email,/Automatic Google Meet setup failed/);
  assert.match(email,/Google Meet link pending/);
});

test("recruiter booking auto-creates Google Meet when no manual meeting URL is supplied",async()=>{
  const action=await read("src/app/actions/recruiter.ts");
  assert.match(action,/if \(!generatedMeetingUrl\)/);
  assert.match(action,/createGoogleMeetDiscoveryMeeting\(\{/);
  assert.match(action,/discovery_meeting_url: generatedMeetingUrl/);
  assert.match(action,/discovery_calendar_event_id: generatedEventId \|\| null/);
  assert.match(action,/discovery_meeting_provider: generatedEventId \? "google_meet" : "manual"/);
  assert.match(action,/meetingUrl: generatedMeetingUrl/);
});

test("existing linkless bookings expose a Google Meet retry action that emails the client",async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/leads/page.tsx"),
  ]);
  assert.match(action,/export async function createDiscoveryGoogleMeetLinkAction/);
  assert.match(action,/subject: "Your discovery call Google Meet link"/);
  assert.match(action,/hrefLabel: "Join Google Meet"/);
  assert.match(page,/Create Google Meet/);
  assert.match(page,/createDiscoveryGoogleMeetLinkAction/);
  assert.match(page,/Google Meet created and sent to the client/);
});

test("client discovery confirmation uses branded booking UI and a team reply-to", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /Discovery call confirmed/);
  assert.match(email, /Your call time/);
  assert.match(email, /Google Meet link pending/);
  assert.match(email, /You do not need to book again/);
  assert.match(email, /What we have on your brief/);
  assert.match(email, /Add to Google Calendar/);
  assert.match(email, /Reschedule or cancel/);
  assert.match(email, /process\.env\.CLIENT_REPLY_TO_EMAIL/);
  assert.match(email, /process\.env\.LEAD_NOTIFICATION_EMAIL/);
  assert.doesNotMatch(email, /replyTo:\s*recipient/);

  const start = email.indexOf("export async function sendPublicDiscoveryBookingEmail");
  const end = email.indexOf("export async function sendDiscoveryMeetingSetupFailureEmail");
  const booking = email.slice(start, end);
  assert.doesNotMatch(booking, /\["Lead ID", args\.leadId\]/);
  assert.match(booking, /renderHiringEmail\(/);
});
