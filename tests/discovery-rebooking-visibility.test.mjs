import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("cancelled and no-show discovery calls keep a visible rebooking form",()=>{
  const page=read("src/app/book-client-call/manage/page.tsx");
  const form=read("src/components/manage-booking-form.tsx");
  assert.match(page,/lead\.discovery_outcome === "no_show"/);
  assert.match(page,/lead\.discovery_outcome === "cancelled"/);
  assert.match(page,/Boolean\(lead\.discovery_cancelled_at\)/);
  assert.match(page,/<ManageBookingForm token=\{token\} days=\{days\} rebookOnly=\{rebookOnly\}/);
  assert.doesNotMatch(page,/lead\.discovery_cancelled_at \? <p>This call is cancelled\.<\/p>/);
  assert.match(form,/rebookOnly \? "Rebook call" : "Reschedule call"/);
});

test("cancelled calls create a fresh Google Meet when rebooked",()=>{
  const booking=read("src/app/actions/booking.ts");
  assert.match(booking,/const canReuseCalendarEvent = Boolean\(previousEventId && !lead\.discovery_cancelled_at && lead\.discovery_outcome !== "cancelled"\)/);
  assert.match(booking,/meeting = canReuseCalendarEvent[\s\S]*updateGoogleMeetDiscoveryMeeting[\s\S]*createGoogleMeetDiscoveryMeeting/);
  assert.match(booking,/discovery_calendar_event_id: meeting\?\.eventId \|\| \(canReuseCalendarEvent \? previousEventId : null\)/);
});

test("clients can reach discovery call management from their dashboard",()=>{
  const page=read("src/app/workspace/client/page.tsx");
  const booking=read("src/app/actions/booking.ts");
  assert.match(page,/Discovery call/);
  assert.match(page,/Rebook call/);
  assert.match(page,/Manage \/ reschedule call/);
  assert.match(page,/openClientDiscoveryBookingAction/);
  assert.match(booking,/export async function openClientDiscoveryBookingAction/);
  assert.match(booking,/\.eq\("client_id", userId\)/);
  assert.match(booking,/discovery_manage_token_hash: manage\.hash/);
});

test("Recruiter Today exposes an actionable call rebooking queue",()=>{
  const today=read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(today,/id="call-rebooking"/);
  assert.match(today,/>Call rebooking</);
  assert.match(today,/Send rebooking link/);
  assert.match(today,/sendDiscoveryNoShowRebookAction/);
  assert.match(today,/Link sent/);
  assert.match(today,/Waiting for the client to choose a new time/);
});

test("cancellation email points directly back to rebooking",()=>{
  const booking=read("src/app/actions/booking.ts");
  assert.match(booking,/heading: "Your discovery call is cancelled"/);
  assert.match(booking,/hrefLabel: "Rebook your call"/);
  assert.match(booking,/choose another available time/);
});
