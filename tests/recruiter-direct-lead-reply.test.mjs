import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const leads = fs.readFileSync("src/app/workspace/recruiter/leads/page.tsx", "utf8");
const actions = fs.readFileSync("src/app/actions/recruiter.ts", "utf8");
const email = fs.readFileSync("src/lib/email.ts", "utf8");

test("recruiter CRM does not expose pre-shortlist client email composer", () => {
  assert.match(leads, /Client email is intentionally held until recruiter-reviewed VAs are ready/);
  assert.doesNotMatch(leads, /action=\{sendClientFollowupAction\}/);
  assert.doesNotMatch(leads, /PendingSubmitButton label="Send reply"/);
  assert.doesNotMatch(leads, /Write another reply/);
  assert.match(leads, /Log external email/);
  assert.match(leads, /Mark called/);
  assert.doesNotMatch(leads, /href=\{\`mailto:/);
});

test("explicit CRM client email is manual while automated pre-shortlist email stays gated", () => {
  assert.match(actions, /sendStaffClientFollowupEmail/);
  const start=email.indexOf("export async function sendStaffClientFollowupEmail");
  assert.ok(start >= 0);
  assert.doesNotMatch(email.slice(start,start+1400),/client_email_deferred_until_shortlist/);
  assert.match(email,/const CLIENT_PRE_SHORTLIST_EMAILS_ENABLED = false/);
});
