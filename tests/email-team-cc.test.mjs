import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("automated customer and VA email does not add archive or team BCC by default", () => {
  const email = source("src/lib/email.ts");

  assert.doesNotMatch(email, /DEFAULT_TEAM_BCC/);
  assert.doesNotMatch(email, /teamBccRecipients/);
  assert.doesNotMatch(email, /discoveryBookingBccRecipients/);
  assert.doesNotMatch(email, /applicationBccRecipients/);
  assert.match(email, /const archiveBcc = options\?\.archive === true/);
  assert.doesNotMatch(email, /teamCc/);
});

test("human-written client follow-ups keep archive copying opt-in", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /archiveCopy\?: boolean/);
  assert.match(email, /args\.archiveCopy \? staffClientFollowupBccRecipients/);
  assert.match(email, /"client_followup", \{ archive: false/);
});

test("human-written client follow-ups expose an explicit archive opt-in", () => {
  const action = source("src/app/actions/recruiter.ts");
  const page = source("src/app/workspace/recruiter/leads/page.tsx");

  assert.match(action, /formData\.get\("archive_copy"\) === "1"/);
  assert.match(action, /archiveCopy/);
  assert.match(page, /name="archive_copy"/);
  assert.match(page, /hidden archive copy/);
});

test("password reset and account confirmation remain recipient-only", () => {
  const email = source("src/lib/email.ts");
  const auth = source("src/app/actions/auth.ts");

  assert.match(auth, /resetPasswordForEmail\(email/);
  assert.match(auth, /subject: "Your password was changed"/);
  assert.match(email, /"account_confirmation", \{ archive: false/);
  assert.match(email, /"password_recovery", \{ archive: false/);
});

test("malformed email addresses are rejected before Resend", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /local\.includes\("\.\."\)/);
  assert.match(email, /domain\.includes\("\.\."\)/);
  assert.match(email, /const recipient = normalizeEmailAddress\(args\.to\);/);
  assert.match(email, /reason: !recipient \? "invalid_recipient" : "email_not_configured"/);
});

test("external emails hide Erwin and Jervis, while Bryan is blocked from all delivery", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /const PRIVATE_INTERNAL_EMAILS = normalizeEmailList\(\[/);
  assert.match(email, /"erwinvalles20@gmail\.com"/);
  assert.match(email, /"jrvsaccad@gmail\.com"/);
  assert.match(email, /const BLOCKED_EMAIL_RECIPIENTS = normalizeEmailList\(\[/);
  assert.match(email, /"bryanbatarina@gmail\.com"/);
  assert.match(email, /const isBlockedEmailRecipient/);
  assert.match(email, /const hasExternalRecipient = rawTo\.some/);
  assert.match(email, /const replyTo = hasExternalRecipient/);
});

test("Bryan is also blocked from direct VA match emails", () => {
  const matchEmail = source("src/lib/match-email.ts");
  assert.match(matchEmail, /BLOCKED_EMAIL_RECIPIENTS = new Set\(\["bryanbatarina@gmail\.com"\]\)/);
  assert.match(matchEmail, /const blocked = BLOCKED_EMAIL_RECIPIENTS\.has\(to\.toLowerCase\(\)\)/);
  assert.match(matchEmail, /reason: blocked \? "blocked_recipient"/);
});

test("system email tests do not copy archive recipients", () => {
  const email = source("src/lib/email.ts");
  assert.match(email, /}, "system_test", \{ archive: false/);
});
