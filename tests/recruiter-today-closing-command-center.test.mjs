import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Recruiter Today exposes a dedicated sales closing command center", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  for (const copy of [
    "Sales closing",
    "Close the loop before leads go cold.",
    "Discovery outcomes",
    "Proposal handoff",
    "Client replies",
    "Proposal actions",
    "Overdue follow-ups",
    "Stalled / no next step",
    "Closing queue is clear",
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

test("conversion blockers outrank routine sourcing work in the Next up hierarchy", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");

  const replies = page.indexOf('title:"Reply to clients"');
  const overdueDiscovery = page.indexOf('title:"Resolve overdue discovery outcomes"');
  const missingProposal = page.indexOf('title:"Prepare qualified proposals"');
  const draftProposal = page.indexOf('title:"Send proposal drafts"');
  const proposals = page.indexOf('title:"Move open proposals"');
  const overdue = page.indexOf('title:"Recover overdue follow-ups"');
  const stalled = page.indexOf('title:"Recover stalled client leads"');
  const discovery = page.indexOf('title:"Prepare upcoming discovery calls"');
  const sourcing = page.indexOf('title:"Build the first shortlist"');

  assert.ok(replies >= 0 && overdueDiscovery > replies && missingProposal > overdueDiscovery && draftProposal > missingProposal);
  assert.ok(proposals > draftProposal && overdue > proposals && stalled > overdue);
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


test("Recruiter Today promotes discovery and proposal handoff blockers from the existing summary queue", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page,/summary\.today_queue/);
  assert.match(page,/overdueDiscoveryActions/);
  assert.match(page,/proposalDraftActions/);
  assert.match(page,/proposalMissingActions/);
  assert.match(page,/item\.kind === "proposal_draft"/);
  assert.match(page,/item\.kind === "proposal_missing"/);
  assert.doesNotMatch(page,/from\("lead_proposals"\)/);
});
