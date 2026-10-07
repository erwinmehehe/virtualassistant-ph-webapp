import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("recruiter CRM keeps normal lead views newest-first", () => {
  const crm = source("src/app/workspace/recruiter/crm/page.tsx");

  assert.match(crm, /\.order\("created_at", \{ ascending: false \}\)/);
  assert.match(crm, /return new Date\(b\.created_at\)\.getTime\(\) - new Date\(a\.created_at\)\.getTime\(\);/);
  assert.doesNotMatch(crm, /view === "active" \|\| view === "mine" \|\| view === "qualified"/);
});

test("recruiter CRM preserves urgency-specific ordering for action and win-back views", () => {
  const crm = source("src/app/workspace/recruiter/crm/page.tsx");

  assert.match(crm, /if \(view === "attention"\)/);
  assert.match(crm, /if \(view === "winback"\)/);
});
