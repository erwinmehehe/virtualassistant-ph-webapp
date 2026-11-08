import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("terminal applications cannot be reopened or withdrawn, including under concurrent updates", async () => {
  const source = await read("src/app/actions/applications.ts");
  const withdraw = source.slice(source.indexOf("export async function withdrawApplicationAction"), source.indexOf("export async function updateApplicationStatusAction"));
  const update = source.slice(source.indexOf("export async function updateApplicationStatusAction"), source.indexOf("export async function hireCandidateAction"));
  assert.match(withdraw, /\["hired", "rejected", "withdrawn"\]\.includes\(application\.status\)/);
  assert.match(withdraw, /\.eq\("status", application\.status\)[\s\S]*?\.select\("id"\)/);
  assert.match(withdraw, /if \(!withdrawn\) throw/);
  assert.match(update, /\["hired", "rejected", "withdrawn"\]\.includes\(application\.status\)/);
  assert.match(update, /\.eq\("status", application\.status\)[\s\S]*?\.select\("id"\)/);
  assert.match(update, /if \(!updated\) throw/);
});

test("stale job edits cannot reopen or overwrite a closed job", async () => {
  const source = await read("src/app/actions/jobs.ts");
  const update = source.slice(source.indexOf("export async function createJobAction"), source.indexOf("export async function closeJobAction"));
  assert.match(update, /if \(ownedJob\.status === "closed"\)/);
  assert.match(update, /\.eq\("moderation_status", ownedJob\.moderation_status\)[\s\S]*?\.eq\("status", ownedJob\.status\)/);
});

test("rescheduling never silently advances CRM after a configured calendar failure and compensates failed saves", async () => {
  const source = await read("src/app/actions/booking.ts");
  const reschedule = source.slice(source.indexOf("export async function rescheduleDiscoveryBookingAction"), source.indexOf("export async function openClientDiscoveryBookingAction"));
  assert.match(reschedule, /if \(canReuseCalendarEvent \|\| calendarConfigured\)/);
  assert.match(reschedule, /Google Calendar reschedule failed/);
  assert.match(reschedule, /redirect\(managePath\(token, "error=calendar"\)\)/);
  assert.match(reschedule, /saveQuery = lead\.discovery_scheduled_at/);
  assert.match(reschedule, /if \(error \|\| !saved\)/);
  assert.match(reschedule, /const persistedTime = persistedBooking/);
  assert.match(reschedule, /startsAt: persistedTime/);
  assert.match(reschedule, /startsAt: lead\.discovery_scheduled_at/);
  assert.match(reschedule, /cancelGoogleMeetDiscoveryMeeting\(meeting\.eventId\)/);
  const cancellation = source.slice(source.indexOf("export async function cancelDiscoveryBookingAction"), source.indexOf("export async function rescheduleDiscoveryBookingAction"));
  assert.match(cancellation, /calendarCancelled = true/);
  assert.ok(cancellation.indexOf("await cancelGoogleMeetDiscoveryMeeting") < cancellation.indexOf('.update({ discovery_cancelled_at: now'));
  assert.match(cancellation, /cancelled meeting restoration needs manual reconciliation/);
  assert.match(cancellation, /\.eq\("discovery_scheduled_at", lead\.discovery_scheduled_at\)/);
  assert.match(cancellation, /\.is\("discovery_cancelled_at", null\)/);
  assert.match(cancellation, /const calendarWasStillCurrent =/);
  assert.match(cancellation, /startsAt: restoreTime/);
  assert.match(cancellation, /\.eq\("discovery_calendar_event_id", lead\.discovery_calendar_event_id\)/);
  assert.match(cancellation, /cancelGoogleMeetDiscoveryMeeting\(restored\.eventId\)/);
});

test("Didit verification reads signed bytes under a stream-enforced 128 KiB limit", async () => {
  const [webhook, security] = await Promise.all([
    read("src/app/api/identity/didit/route.ts"),
    read("src/lib/http-security.ts"),
  ]);
  assert.match(webhook, /readRequestBuffer\(request, 128 \* 1024\)/);
  assert.match(webhook, /RequestBodyTooLargeError \? 413 : 400/);
  assert.doesNotMatch(webhook, /request\.arrayBuffer\(\)/);
  const reader = security.slice(security.indexOf("export async function readRequestBuffer"), security.indexOf("export async function readRequestText"));
  assert.match(reader, /totalBytes \+= value\.byteLength/);
  assert.match(reader, /if \(totalBytes > maxBytes\)/);
  assert.match(reader, /throw new RequestBodyTooLargeError\(\)/);
  assert.match(reader, /Buffer\.concat\(chunks, totalBytes\)/);
});

test("Stripe only reconciles paid checkout sessions, including asynchronous success", async () => {
  const webhook = await read("src/app/api/webhooks/stripe/route.ts");
  assert.match(webhook, /checkout\.session\.async_payment_succeeded/);
  assert.match(webhook, /session\.payment_status !== "paid"/);
  assert.ok(webhook.indexOf('session.payment_status !== "paid"') < webhook.indexOf("const admin = createAdminClient()"));
  assert.match(webhook, /claim_payment_provider_event/);
  assert.match(webhook, /transition_payment_state/);
});
