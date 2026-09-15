import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const leads = fs.readFileSync("src/app/workspace/recruiter/leads/page.tsx", "utf8");
const actions = fs.readFileSync("src/app/actions/recruiter.ts", "utf8");

test("recruiter CRM exposes direct in-platform replies", () => {
  assert.match(leads, /Reply to client/);
  assert.match(leads, /Send reply/);
  assert.match(leads, /action=\{sendClientFollowupAction\}/);
  assert.match(leads, /To: <strong>\{lead\.email\}<\/strong>/);
  assert.match(leads, /open=\{!lead\.first_contact_at \|\| slaMissed\}/);
  assert.match(leads, /Open email app/);
  assert.match(leads, /Log external email/);
});

test("direct replies update CRM operations state", () => {
  assert.match(actions, /patch\.first_contact_at = now\.toISOString\(\)/);
  assert.match(actions, /patch\.crm_stage = "contacted"/);
  assert.match(actions, /next_follow_up_at/);
  assert.match(actions, /action: "client_followup_sent"/);
});
