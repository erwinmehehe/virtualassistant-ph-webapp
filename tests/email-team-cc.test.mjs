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
  assert.match(email, /const to = normalizeEmailList\(payload\.to\)/);
  assert.match(email, /const requestedBcc = normalizeEmailList/);
  assert.match(email, /archiveBcc/);
  assert.match(email, /teamBccRecipients/);
  assert.match(email, /bcc: bcc\.length \? bcc : undefined/);

  // Regression: archive recipients must never be merged into the visible To line.
  assert.doesNotMatch(email, /normalizeEmailList\(\[payload\.to, archive/);
});

test("client-facing operational copies use BCC rather than visible CC", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /bcc: staffClientFollowupBccRecipients/);
  assert.match(email, /bcc: discoveryBookingBccRecipients/g);
  assert.match(email, /"jrvsaccad@gmail\.com"/);
  assert.match(email, /"bryanbatarina@gmail\.com"/);
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
