import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("client operational email is held until recruiter-approved VAs are ready", async () => {
  const [leads,recruiter,agency,booking,reminders,maintenance,applications,proposals,ops,email] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/app/actions/agency-role.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/api/cron/discovery-reminders/route.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
    read("src/app/actions/applications.ts"),
    read("src/app/actions/proposals.ts"),
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/lib/email.ts"),
  ]);

  assert.doesNotMatch(leads,/sendLeadAcknowledgementEmail|sendPublicDiscoveryBookingEmail/);
  assert.match(leads,/attendeeEmails: \[\]/);
  assert.doesNotMatch(recruiter,/sendStaffClientFollowupEmail|sendDiscoveryBookingEmail|sendDiscoveryNoShowRebookEmail/);
  assert.match(recruiter,/attendeeEmails: \[\]/);
  assert.doesNotMatch(agency,/sendClaimDraftEmail|sendRoleDetailsRequestEmail/);
  assert.doesNotMatch(booking,/sendTransactionalEventEmail/);
  assert.doesNotMatch(booking,/attendeeEmails: \[lead\.email\]/);
  assert.doesNotMatch(reminders,/sendDiscoveryReminderEmail/);
  assert.match(reminders,/client_email_shortlist_only/);
  assert.doesNotMatch(maintenance,/sendClaimDraftEmail/);
  assert.match(maintenance,/review_shortlist_24h", email: false/);
  assert.match(maintenance,/review_shortlist_48h", email: false/);
  assert.doesNotMatch(applications,/sendApplicationEmail/);
  assert.doesNotMatch(proposals,/sendLeadProposalEmail/);
  assert.doesNotMatch(proposals,/to: lead\.email/);
  assert.doesNotMatch(ops,/to: clientAuth\.user\?\.email/);
  assert.doesNotMatch(ops,/attendeeEmails = \[vaAuth\.user\?\.email, clientAuth\.user\?\.email\]/);

  for (const fn of [
    "sendLeadAcknowledgementEmail",
    "sendStaffClientFollowupEmail",
    "sendDiscoveryBookingEmail",
    "sendPublicDiscoveryBookingEmail",
    "sendDiscoveryNoShowRebookEmail",
    "sendDiscoveryReminderEmail",
    "sendClaimDraftEmail",
    "sendRoleDetailsRequestEmail",
    "sendLeadProposalEmail",
    "sendApplicationEmail",
  ]) {
    const start=email.indexOf(`export async function ${fn}`);
    assert.ok(start>=0,`missing ${fn}`);
    const next=email.indexOf("export async function ",start+25);
    const section=email.slice(start,next>=0?next:undefined);
    assert.match(section,/CLIENT_PRE_SHORTLIST_EMAIL_ENABLED/,`${fn} must be mail-layer guarded`);
  }
});

test("shortlist delivery is the intentional client email boundary", async () => {
  const matching=await read("src/app/actions/matching.ts");
  assert.match(matching,/eventType: "client_shortlist_invite"/);
  assert.match(matching,/eventType: "client_shortlist_ready"/);
  assert.match(matching,/Your recruiter-selected VAs are ready/);
  assert.match(matching,/Review my VA shortlist/);
  assert.match(matching,/recruiter-approved VA candidates are ready for your hiring request/);
});

test("same-session hiring enquiries reuse one recruiting thread", async () => {
  const leads=await read("src/app/actions/leads.ts");
  assert.match(leads,/session_id", sessionId/);
  assert.match(leads,/eq\("lead_type", "client_hiring"\)/);
  assert.match(leads,/24 \* 60 \* 60 \* 1000/);
});

test("booking page uses the sleek two-step experience without email promises", async () => {
  const [page,form,css]=await Promise.all([
    read("src/app/book-client-call/page.tsx"),
    read("src/components/client-booking-form.tsx"),
    read("src/app/book-client-call/booking.css"),
  ]);
  assert.match(page,/Book a focused call about the VA you need/);
  assert.match(page,/A clear hiring plan, not a generic sales call/);
  assert.match(form,/booking-flow-progress/);
  assert.match(form,/booking-calendar-shell/);
  assert.match(form,/booking-selected-slot/);
  assert.match(form,/Confirm booking/);
  assert.doesNotMatch(page,/confirmation was sent to your email/i);
  assert.doesNotMatch(form,/confirmation includes/i);
  assert.match(css,/\.booking-call-preview/);
  assert.match(css,/\.booking-flow-progress/);
  assert.match(css,/\.booking-calendar-shell/);
  assert.match(css,/@media \(max-width: 640px\)/);
});
