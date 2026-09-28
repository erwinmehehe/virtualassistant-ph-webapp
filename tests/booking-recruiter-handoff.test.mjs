import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("discovery booking creates or links a recruiting role owned by the lead recruiter", async () => {
  const leads = await read("src/app/actions/leads.ts");

  assert.match(leads, /\.select\("id,owner_id"\)\.single\(\)/);
  assert.match(leads, /recruiterId: bookingOwnerId/);
  assert.match(leads, /ownerId: bookingOwnerId/);
  assert.match(leads, /booking_handoff_ready/);
  assert.match(leads, /booking_handoff_recovery_needed/);
});

test("booking role failures create an urgent recruiter recovery task instead of disappearing", async () => {
  const leads = await read("src/app/actions/leads.ts");

  assert.match(leads, /createBookingHandoffRecoveryTask/);
  assert.match(leads, /Fix booking role handoff/);
  assert.match(leads, /priority: "urgent"/);
  assert.match(leads, /\/workspace\/recruiter\/crm\//);
});

test("internal booking alert links recruiters to CRM and the recruiting role", async () => {
  const email = await read("src/lib/email.ts");

  assert.match(email, /Recruiter handoff/);
  assert.match(email, /Review hiring role/);
  assert.match(email, /Review booking in CRM/);
  assert.match(email, /workspace\/recruiter\/roles/);
  assert.match(email, /workspace\/recruiter\/crm/);
});

test("Recruiter My Day shows the explicit booked-to-shortlist handoff", async () => {
  const [today, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css"),
  ]);

  for (const label of ["Booked", "Review brief", "Match VAs", "Shortlist"]) {
    assert.match(today, new RegExp(label));
  }
  assert.match(today, /Review booking/);
  assert.match(today, /Prepare top matches/);
  assert.match(css, /\.handoffSteps/);
});

test("recruiter discovery agenda uses the real meeting provider label and direct CRM record", async () => {
  const agenda = await read("src/app/workspace/recruiter/agenda/page.tsx");

  assert.match(agenda, /Join Google Meet/);
  assert.match(agenda, /meetingActionLabel/);
  assert.match(agenda, /\/workspace\/recruiter\/crm\/\$\{item\.id\}/);
  assert.doesNotMatch(agenda, /<Video size=\{13\}\/?> Join Zoom/);
});
