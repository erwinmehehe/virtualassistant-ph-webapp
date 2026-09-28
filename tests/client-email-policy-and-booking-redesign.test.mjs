import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("client gets one acknowledgement while automated pre-shortlist nudges stay off", async () => {
  const email=await read("src/lib/email.ts");
  assert.match(email,/const CLIENT_PRE_SHORTLIST_EMAILS_ENABLED = false/);

  const acknowledgementStart=email.indexOf("export async function sendLeadAcknowledgementEmail");
  assert.ok(acknowledgementStart >= 0, "missing lead acknowledgement");
  const acknowledgement=email.slice(acknowledgementStart,acknowledgementStart+2200);
  assert.doesNotMatch(acknowledgement,/client_email_deferred_until_shortlist/);
  assert.match(acknowledgement,/Activate my hiring workspace/);
  assert.doesNotMatch(acknowledgement,/Book a 20-minute call/);

  for (const fn of [
    "sendClaimDraftEmail",
    "sendRoleDetailsRequestEmail",
    "sendDiscoveryBookingEmail",
    "sendPublicDiscoveryBookingEmail",
    "sendDiscoveryNoShowRebookEmail",
    "sendDiscoveryReminderEmail",
    "sendLeadProposalEmail",
  ]) {
    const start=email.indexOf(`export async function ${fn}`);
    assert.ok(start >= 0, `missing ${fn}`);
    const excerpt=email.slice(start,start+1400);
    assert.match(excerpt,/client_email_deferred_until_shortlist/);
  }

  const manualStart=email.indexOf("export async function sendStaffClientFollowupEmail");
  assert.ok(manualStart >= 0, "missing staff client email helper");
  const manual=email.slice(manualStart,manualStart+1600);
  assert.doesNotMatch(manual,/client_email_deferred_until_shortlist/);
  assert.match(manual,/Manual recruiter email only/);
});
test("pre-shortlist workflows do not call client email helpers", async () => {
  const [agency,applications,cleanup,recruiterOps,ops,reminders,rolePage,today] = await Promise.all([
    read("src/app/actions/agency-role.ts"),
    read("src/app/actions/applications.ts"),
    read("src/app/actions/recruiter-cleanup.ts"),
    read("src/app/actions/recruiter-ops.ts"),
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/recruiter/today/page.tsx"),
  ]);

  assert.doesNotMatch(agency,/sendClaimDraftEmail|sendRoleDetailsRequestEmail/);
  assert.doesNotMatch(applications,/sendApplicationEmail/);
  assert.doesNotMatch(cleanup,/sendStaffClientFollowupEmail|send_followup/);
  assert.doesNotMatch(recruiterOps,/sendStaffClientFollowupEmail/);
  assert.doesNotMatch(ops,/to: clientAuth\.user\?\.email/);
  assert.doesNotMatch(ops,/attendeeEmails = \[vaAuth\.user\?\.email, clientAuth\.user\?\.email\]/);
  assert.doesNotMatch(reminders,/sendDiscoveryReminderEmail/);
  assert.match(reminders,/client_email_shortlist_only/);
  assert.doesNotMatch(rolePage,/sendClientAccountClaimAction|role_details_email_warning/);
  assert.doesNotMatch(today,/cleanup_action" value="send_followup"/);
  assert.doesNotMatch(today,/sendDiscoveryNoShowRebookAction|Send rebooking link/);
});

test("releasing recruiter-approved VAs sends the next automated client hiring email", async () => {
  const matching=await read("src/app/actions/matching.ts");
  assert.match(matching,/eventType: "client_shortlist_delivery"/);
  assert.match(matching,/subject: `Your VA shortlist is ready:/);
  assert.match(matching,/hrefLabel: "Review my VA shortlist"/);
  assert.match(matching,/client-shortlist-delivery-/);
});

test("shortlist reminders stay in-app instead of emailing the client again", async () => {
  const maintenance=await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance,/action: "review_shortlist_24h", email: false/);
  assert.match(maintenance,/action: "review_shortlist_48h", email: false/);
});

test("recruiter inbox does not encourage pre-shortlist email replies", async () => {
  const page=await read("src/app/workspace/recruiter/leads/page.tsx");
  assert.match(page,/Needs triage/);
  assert.match(page,/Client email is intentionally held until recruiter-reviewed VAs are ready/);
  assert.doesNotMatch(page,/<strong>Reply to client<\/strong>/);
  assert.doesNotMatch(page,/Write another reply/);
  assert.doesNotMatch(page,/PendingSubmitButton label="Send reply"/);
});

test("same service lead duplicates are deduped for 24 hours", async () => {
  const leads=await read("src/app/actions/leads.ts");
  assert.match(leads,/const DUPLICATE_SUBMISSION_WINDOW_MINUTES = 24 \* 60/);
  assert.match(leads,/\.eq\("lead_type", "client_hiring"\)\.ilike\("email", email\)/);
});

test("public discovery booking does not trigger Google attendee email", async () => {
  const [leads,ops]=await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/booking-operations.ts"),
  ]);
  assert.match(leads,/notifyAttendees: false/);
  assert.match(ops,/notifyAttendees\?: boolean/);
  assert.match(ops,/sendUpdates=\$\{args\.notifyAttendees === false \? "none" : "all"\}/);
});

test("booking page uses the simplified low-friction booking experience", async () => {
  const [page,form,css]=await Promise.all([
    read("src/app/book-client-call/page.tsx"),
    read("src/components/client-booking-form.tsx"),
    read("src/app/book-client-call/booking.css"),
  ]);
  assert.match(page,/Book a discovery call/);
  assert.doesNotMatch(page,/booking-call-preview/);
  assert.doesNotMatch(form,/booking-flow-progress/);
  assert.match(form,/Choose a time/);
  assert.match(form,/booking-calendar-shell/);
  assert.match(form,/booking-selected-slot/);
  assert.doesNotMatch(form,/booking-timezone-control/);\n  assert.match(form,/Loading available times/);
  assert.match(form,/activeDay\?\.slots\.map/);
  assert.doesNotMatch(form,/booking-show-times/);
  assert.match(form,/Book discovery call/);
  assert.match(form,/Five required fields/);
  assert.match(css,/\.booking-card-head/);
  assert.match(css,/\.booking-calendar-shell/);
  assert.match(css,/\.booking-selected-slot/);
  assert.match(css,/\.booking-timezone-control/);
  assert.match(css,/background: #fff/);
});
