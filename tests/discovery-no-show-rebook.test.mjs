import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("no-show rebooking email is policy-suppressed before a VA shortlist", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendDiscoveryNoShowRebookEmail");
  const end = email.indexOf("export async function sendDiscoveryReminderEmail", start);
  const block = email.slice(start, end);
  assert.match(block, /client_email_deferred_until_shortlist/);
});

test("no-show rebooking action is no-show only and blocks duplicate sends before Resend", async () => {
  const action = await read("src/app/actions/recruiter.ts");
  assert.match(action, /sendDiscoveryNoShowRebookAction/);
  assert.match(action, /discovery-no-show-rebook-\$\{leadId\}/);
  assert.match(action, /outbound_email_events/);
  assert.match(action, /\["sending", "sent", "delivered"\]\.includes/);
  assert.match(action, /\["bounced", "complained", "suppressed"\]\.includes/);
  assert.match(action, /lead\.discovery_outcome !== "no_show"/);
  assert.match(action, /rebook_email_already_sent=1/);
  assert.match(action, /createBookingManageToken/);
  assert.match(action, /bookingManageUrl\(manageToken\)/);
  assert.match(action, /next_follow_up_at: new Date\(now\.getTime\(\) \+ 2 \* 86400000\)/);
});

test("marking no-show keeps the recruiter queue visible without client email", async () => {
  const page = await read("src/app/workspace/recruiter/leads/page.tsx");
  assert.match(page, /Client missed the call/);
  assert.match(page, /No automatic rebooking email is sent/);
  assert.doesNotMatch(page, /Send rebooking email/);
  assert.match(page, /Mark no-show/);
});

test("client rebooking reopens discovery after a no-show", async () => {
  const booking = await read("src/app/actions/booking.ts");
  const start = booking.indexOf("export async function rescheduleDiscoveryBookingAction");
  assert.ok(start >= 0);
  const block = booking.slice(start);
  assert.match(block, /discovery_completed_at: null/);
  assert.match(block, /discovery_outcome: "rescheduled"/);
  assert.match(block, /crm_stage: "discovery_booked"/);
  assert.match(block, /discovery_reminder_24h_sent_at: null/);
  assert.match(block, /discovery_reminder_1h_sent_at: null/);
});


test("no-show booking manager focuses the client on choosing another time", async () => {
  const [page, form] = await Promise.all([
    read("src/app/book-client-call/manage/page.tsx"),
    read("src/components/manage-booking-form.tsx")
  ]);
  assert.match(page, /discovery_outcome/);
  assert.match(page, /const rebookOnly = lead\.discovery_outcome === "no_show" \|\| Boolean\(lead\.discovery_cancelled_at\) \|\| lead\.discovery_outcome === "cancelled"/);
  assert.match(page, /rebookOnly=\{rebookOnly\}/);
  assert.match(page, /Choose another time/);
  assert.match(form, /rebookOnly \? "Rebook call" : "Reschedule call"/);
  assert.match(form, /!rebookOnly \? <section/);
});
