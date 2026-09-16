import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const page = fs.readFileSync("src/app/workspace/recruiter/leads/page.tsx", "utf8");

test("recruiter leads default to active pipeline", () => {
  assert.match(page, /const view = params\.view \|\| "open";/);
});

test("recruiter lead cards do not expose direct email-app or call buttons", () => {
  assert.doesNotMatch(page, /Open email app/);
  assert.doesNotMatch(page, /> Call<\/a>/);
  assert.doesNotMatch(page, /href={`mailto:/);
  assert.doesNotMatch(page, /href={`tel:/);
});

test("linked role navigation is phrased as navigation, not role status", () => {
  assert.match(page, />View linked role<\/Link>/);
  assert.doesNotMatch(page, />Open linked role<\/Link>/);
});
