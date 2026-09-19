import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const page = fs.readFileSync("src/app/workspace/recruiter/leads/page.tsx", "utf8");
const closeLead = fs.readFileSync("src/app/actions/close-lead.ts", "utf8");

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

test("closing a lead can close every non-closed linked role state", () => {
  assert.match(closeLead, /\.in\("status", \["draft", "pending", "published"\]\)/);
});

test("shared recruiter CRM does not block closing another recruiter's lead", () => {
  assert.doesNotMatch(closeLead, /This lead belongs to another recruiter/);
  assert.doesNotMatch(closeLead, /lead\.owner_id !== user\.id/);
  assert.match(closeLead, /Any recruiter or admin who can/);
});

