import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("a closed lead leaves every working list", () => {
  const adminLeads = source("src/app/workspace/admin/leads/page.tsx");

  // Admin oversight listed closed leads with no filter at all.
  assert.match(adminLeads, /const showClosed=params\.closed==="1"/);
  assert.match(adminLeads, /showClosed\?\(leads\|\|\[\]\):\(leads\|\|\[\]\)\.filter\(isOpen\)/);
  // A lead with no stage yet is open, not closed.
  assert.match(adminLeads, /CLOSED_HIRING_STAGES\.has\(String\(lead\.crm_stage\|\|"new"\)\)/);
  // Closed leads stay reachable behind a toggle rather than disappearing.
  assert.match(adminLeads, /Show closed/);
});

test("closing a lead refreshes every page that lists it", () => {
  const close = source("src/app/actions/close-lead.ts");

  for (const path of [
    "/workspace/recruiter/leads",
    "/workspace/recruiter/leads/board",
    "/workspace/recruiter/queue",
    "/workspace/recruiter/today",
    "/workspace/recruiter/agenda",
    "/workspace/recruiter/stalled",
    "/workspace/admin/leads",
    "/workspace/admin/today"
  ]) {
    assert.ok(close.includes(`revalidatePath("${path}")`), `close should refresh ${path}`);
  }
});
