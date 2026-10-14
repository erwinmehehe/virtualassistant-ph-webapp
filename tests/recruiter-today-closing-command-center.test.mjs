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

test("Today prioritizes client replies, interviews and waiting decisions before routine sourcing", async () => {
  const { recruiterTodayFocus } = await import("../src/lib/recruiter-today-focus.ts");
  const signals = { clientReplies: 2, firstContacts: 1, interviewsRequested: 3, clientDecisionsWaiting: 4, approvalReady: 0 };
  assert.equal(recruiterTodayFocus([], signals).next.title, "Reply to clients");
  assert.equal(recruiterTodayFocus([], { ...signals, clientReplies: 0, firstContacts: 0 }).next.title, "Schedule or review interviews");
  assert.equal(recruiterTodayFocus([], { ...signals, clientReplies: 0, firstContacts: 0, interviewsRequested: 0 }).next.title, "Follow up on client decisions");
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
