import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("internal team and archive copies are hidden with BCC", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /const DEFAULT_TEAM_BCC = "jrvsaccad@gmail\.com"/);
  assert.match(email, /const teamBccRecipients =/);
  assert.match(email, /const archiveBcc = options\?\.archive === false/);
  assert.match(email, /const rawTo = normalizeEmailList\(payload\.to\)/);
  assert.match(email, /const requestedBcc = normalizeEmailList/);
  assert.match(email, /archiveBcc/);
  assert.match(email, /teamBccRecipients/);
  assert.match(email, /bcc: safeBcc\.length \? safeBcc : undefined/);

  // Regression: archive recipients must never be merged into the visible To line.
  assert.doesNotMatch(email, /normalizeEmailList\(\[payload\.to, archive/);
});

test("client-facing operational copies use BCC rather than visible CC", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /bcc: staffClientFollowupBccRecipients/);
  assert.match(email, /bcc: discoveryBookingBccRecipients/g);
  assert.match(email, /"jrvsaccad@gmail\.com"/);
  assert.doesNotMatch(email, /discoveryBookingBccRecipients[\s\S]{0,500}"bryanbatarina@gmail\.com"/);
  assert.doesNotMatch(email, /staffClientFollowupBccRecipients[\s\S]{0,500}"bryanbatarina@gmail\.com"/);
  assert.match(email, /"erwinvalles20@gmail\.com"/);
  assert.match(email, /bcc: applicationBccRecipients/);
  assert.doesNotMatch(email, /(^|\n)\s*cc:\s*staffClientFollowupBccRecipients/m);
  assert.doesNotMatch(email, /(^|\n)\s*cc:\s*discoveryBookingBccRecipients/m);
  assert.doesNotMatch(email, /(^|\n)\s*cc:\s*applicationBccRecipients/m);
});

test("password reset and password-change security mail remain private", () => {
  const email = source("src/lib/email.ts");
  const auth = source("src/app/actions/auth.ts");

  assert.match(auth, /resetPasswordForEmail\(email/);
  assert.match(auth, /subject: "Your password was changed"/);
  assert.match(email, /const isPasswordChangeNotice =/);
  assert.match(email, /teamCc: args\.teamCc !== false && !isPasswordChangeNotice/);
});


test("malformed email addresses are rejected before Resend and profile reminders skip them", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /local\.includes\("\.\."\)/);
  assert.match(email, /domain\.includes\("\.\."\)/);
  assert.match(email, /const recipient = normalizeEmailAddress\(args\.to\);/);
  assert.match(email, /reason: !recipient \? "invalid_recipient" : "email_not_configured"/);
  assert.match(email, /to: \[recipient\]/);
});

test("external emails hide Erwin and Jervis, while Bryan is blocked from all delivery", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /const PRIVATE_INTERNAL_EMAILS = normalizeEmailList\(\[/);
  assert.match(email, /"erwinvalles20@gmail\.com"/);
  assert.match(email, /"jrvsaccad@gmail\.com"/);
  assert.match(email, /const BLOCKED_EMAIL_RECIPIENTS = normalizeEmailList\(\[/);
  assert.match(email, /"bryanbatarina@gmail\.com"/);
  assert.match(email, /const isBlockedEmailRecipient/);
  assert.match(email, /normalizeEmailList\(payload\.to\)\.filter\(\(email\) => !isBlockedEmailRecipient\(email\)\)/);
  assert.match(email, /normalizeEmailList\(payload\.cc\)\.filter\(\(email\) => !isBlockedEmailRecipient\(email\)\)/);
  assert.match(email, /requestedBcc[\s\S]*filter\(\(email\) => !isBlockedEmailRecipient\(email\)\)/);
  assert.match(email, /const hasExternalRecipient = rawTo\.some\(\(email\) => !isPrivateInternalEmail\(email\)\)/);
  assert.match(email, /const hiddenInternalFromTo = hasExternalRecipient \? rawTo\.filter\(isPrivateInternalEmail\) : \[\]/);
  assert.match(email, /const to = hasExternalRecipient \? rawTo\.filter\(\(email\) => !isPrivateInternalEmail\(email\)\) : rawTo/);
  assert.match(email, /const hiddenInternalFromCc = hasExternalRecipient \? rawCc\.filter\(isPrivateInternalEmail\) : \[\]/);
  assert.match(email, /const requestedCc = hasExternalRecipient \? rawCc\.filter\(\(email\) => !isPrivateInternalEmail\(email\)\) : rawCc/);
  assert.match(email, /hiddenInternalFromTo/);
  assert.match(email, /hiddenInternalFromCc/);
  assert.match(email, /const replyTo = hasExternalRecipient[\s\S]*rawReplyTo\.filter\(\(email\) => !isPrivateInternalEmail\(email\)\)/);
});

test("Bryan is also blocked from direct VA match emails", () => {
  const matchEmail = source("src/lib/match-email.ts");
  assert.match(matchEmail, /BLOCKED_EMAIL_RECIPIENTS = new Set\(\["bryanbatarina@gmail\.com"\]\)/);
  assert.match(matchEmail, /const blocked = BLOCKED_EMAIL_RECIPIENTS\.has\(to\.toLowerCase\(\)\)/);
  assert.match(matchEmail, /reason: blocked \? "blocked_recipient"/);
});


test("system email tests do not copy archive or team recipients", () => {
  const email = source("src/lib/email.ts");

  assert.match(
    email,
    /}, "system_test", \{ archive: false, teamCc: false \}\);/,
  );
});
