import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter Today exposes a dedicated sales closing command center", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  for (const copy of [
    "Sales closing",
    "Close the loop before leads go cold.",
    "Client replies",
    "Proposal actions",
    "Overdue follow-ups",
    "Stalled / no next step",
    "needs closing attention",
  ]) {
    assert.ok(page.includes(copy), `expected closing command center copy: ${copy}`);
  }

  assert.match(page, /id="sales-closing"/);
  assert.match(page, /id="needs-action"/);
  assert.match(page, /closingActionLeadIds/);
});

test("Recruiter Today promotes CRM cleanup signals into the action queue without extra lead queries", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /summary\.cleanup_queue/);
  assert.match(page, /closingCleanupSignals/);
  assert.match(page, /overdueClosingLeads/);
  assert.match(page, /stalledClosingLeads/);
  assert.match(page, /noNextStepLeads/);
  assert.match(page, /kind: "closing_followup"/);
  assert.match(page, /Follow-up overdue:/);
  assert.match(page, /Stalled 72h\+/);
  assert.match(page, /No next step:/);
  assert.doesNotMatch(page, /from\("lead_intake"\)/);
});

test("closing signals are deduped behind higher-priority replies and proposal actions", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  assert.match(page, /higherPriorityClosingLeadIds/);
  assert.match(page, /clientReplies\.map\(\(row\) => row\.lead_id\)/);
  assert.match(page, /proposalActions\.map\(\(row\) => row\.lead_id\)/);
  assert.match(page, /!higherPriorityClosingLeadIds\.has\(row\.id\)/);
});

test("closing actions outrank routine sourcing work in the Next up hierarchy", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  const replies = page.indexOf('title:"Reply to clients"');
  const proposals = page.indexOf('title:"Move open proposals"');
  const overdue = page.indexOf('title:"Recover overdue follow-ups"');
  const stalled = page.indexOf('title:"Recover stalled client leads"');
  const discovery = page.indexOf('title:"Prepare upcoming discovery calls"');
  const sourcing = page.indexOf('title:"Build the first shortlist"');

  assert.ok(replies >= 0 && proposals > replies && overdue > proposals && stalled > overdue);
  assert.ok(discovery > stalled);
  assert.ok(sourcing > discovery);
});

test("Recruiter Today closing command center stays responsive", async () => {
  const css = await read("src/app/workspace/recruiter/today/today.module.css");

  for (const hook of [
    ".closingCommandCenter",
    ".closingCommandHead",
    ".closingSignalGrid",
    ".closingSignalHot",
    ".closingSignalWarm",
    ".closingSignalClear",
    ".closingCommandFoot",
  ]) {
    assert.ok(css.includes(hook), `expected CSS hook: ${hook}`);
  }

  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /@media \(max-width: 640px\)/);
});
