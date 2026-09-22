import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("no-show rebooking email uses the approved direct copy with one branded greeting", async () => {
  const email = await read("src/lib/email.ts");
  const start = email.indexOf("export async function sendDiscoveryNoShowRebookEmail");
  const end = email.indexOf("export async function sendDiscoveryReminderEmail", start);
  assert.ok(start >= 0 && end > start);
  const block = email.slice(start, end);

  assert.match(block, /subject: "Would you like to rebook your call\?"/);
  assert.match(block, /We weren’t able to connect for your scheduled call today\./);
  assert.match(block, /If you’d still like to discuss hiring a virtual assistant, you can choose another time here:/);
  assert.match(block, /If you’re no longer looking, just reply and let us know so we can close the request\./);
  assert.match(block, /ctaLabel: "Rebook your call"/);
  assert.match(block, /appendSignature: false/);
  assert.equal((block.match(/Hi \$\{firstName\}/g) || []).length, 1);
  assert.doesNotMatch(block, /life happens|sorry we missed you|just checking in|hope you.re well/i);
});

test("no-show rebooking action is no-show only and blocks duplicate sends before Resend", async () => {
  const action = await read("src/app/actions/recruiter.ts");
  assert.match(action, /sendDiscoveryNoShowRebookAction/);
  assert.match(action, /discovery-no-show-rebook-\$\{leadId\}/);
  assert.match(action, /outbound_email_events/);
  assert.match(action, /\.eq\("status", "sent"\)/);
  assert.match(action, /lead\.discovery_outcome !== "no_show"/);
  assert.match(action, /rebook_email_already_sent=1/);
  assert.match(action, /createBookingManageToken/);
  assert.match(action, /bookingManageUrl\(manageToken\)/);
  assert.match(action, /next_follow_up_at: new Date\(now\.getTime\(\) \+ 2 \* 86400000\)/);
});

test("marking no-show prompts recruiter to send the rebooking email", async () => {
  const [action, page] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/leads/page.tsx")
  ]);

  assert.match(action, /outcome === "no_show" \? `discovery_completed=1&rebook_prompt=/);
  assert.match(page, /Client marked No show\./);
  assert.match(page, /Send rebooking email/);
  assert.match(page, /Rebooking email sent/);
  assert.match(page, /No duplicate email was sent/);
  assert.match(page, /discovery_no_show_rebook/);
  assert.match(page, /Rebooked/);
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
  assert.match(page, /rebookOnly=\{lead\.discovery_outcome === "no_show"\}/);
  assert.match(page, /Choose another time/);
  assert.match(form, /rebookOnly \? "Rebook call" : "Reschedule call"/);
  assert.match(form, /!rebookOnly \? <section/);
});
