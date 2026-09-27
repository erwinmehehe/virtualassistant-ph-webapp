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

test("legacy client follow-up action is server-gated by shortlist-only email policy", () => {
  assert.match(actions, /sendStaffClientFollowupEmail/);
  assert.match(email, /sendStaffClientFollowupEmail[\s\S]*client_email_deferred_until_shortlist/);
});
