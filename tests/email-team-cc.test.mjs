import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("application mail CCs Jervis by default without coupling CC to archive behavior", () => {
  const email = source("src/lib/email.ts");

  assert.match(email, /const DEFAULT_TEAM_CC = "jrvsaccad@gmail\.com"/);
  assert.doesNotMatch(email, /jrvsaccad@gmail\.coom/);
  assert.match(email, /options\?: \{ archive\?: boolean; teamCc\?: boolean \}/);
  assert.match(email, /options\?\.teamCc === false \? \[\] : teamCcRecipients/);
  assert.match(email, /const cc = requestedCc\.filter/);
  assert.match(email, /const archiveTo = options\?\.archive === false/);
});

test("password reset and password-change security mail remain private", () => {
  const email = source("src/lib/email.ts");
  const auth = source("src/app/actions/auth.ts");

  assert.match(auth, /resetPasswordForEmail\(email/);
  assert.match(auth, /subject: "Your password was changed"/);
  assert.match(email, /const isPasswordChangeNotice =/);
  assert.match(email, /teamCc: args\.teamCc !== false && !isPasswordChangeNotice/);
});
