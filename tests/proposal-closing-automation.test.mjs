import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("sending and viewing proposals queue separate durable closing workflows", async () => {
  const [actions, viewRoute, helper] = await Promise.all([
    read("src/app/actions/proposals.ts"),
    read("src/app/api/proposals/view/route.ts"),
    read("src/lib/trigger-automation.ts"),
  ]);

  assert.match(actions, /queueProposalClosingAutomation/);
  assert.match(viewRoute, /queueProposalViewedAutomation/);
  assert.match(helper, /vaph-proposal-closing/);
  assert.match(helper, /vaph-proposal-viewed/);
  assert.match(helper, /proposal-closing-\$\{proposalId\}-\$\{sendKey\}/);
  assert.match(helper, /proposal-viewed-\$\{proposalId\}-\$\{viewKey\}/);
});

test("proposal closing timing distinguishes unopened proposals from viewed proposals", async () => {
  const [sentTask, viewedTask] = await Promise.all([
    read("automations/trigger/src/proposal-closing.ts"),
    read("automations/trigger/src/proposal-viewed.ts"),
  ]);

  assert.match(sentTask, /24 \* 60 \* 60_000/);
  assert.match(sentTask, /wait\.for\(\{ hours: 24 \}\)/);
  assert.match(sentTask, /"sent_24h"/);
  assert.match(sentTask, /"sent_48h"/);
  assert.match(viewedTask, /4 \* 60 \* 60_000/);
  assert.match(viewedTask, /"viewed_4h"/);
});

test("callback ignores resends and stale view events and escalates only active sent proposals", async () => {
  const route = await read(
    "src/app/api/internal/automation/proposal-closing/route.ts",
  );

  assert.match(route, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(route, /stale_send/);
  assert.match(route, /stale_view/);
  assert.match(route, /status !== "sent"/);
  assert.match(route, /viewed_waiting/);
  assert.match(route, /not_viewed/);
  assert.match(route, /sent_48h/);
  assert.match(route, /urgent/);
});

test("changes requested create a recruiter action while accepted or declined proposals clear closing work", async () => {
  const [actions, ops] = await Promise.all([
    read("src/app/actions/proposals.ts"),
    read("src/lib/proposal-closing-automation.ts"),
  ]);

  assert.match(actions, /ensureProposalClosingTask/);
  assert.match(actions, /resolveProposalClosingArtifacts/);
  assert.match(ops, /changes_requested/);
  assert.match(ops, /revise now/);
  assert.match(ops, /Proposal close/);
});

test("maintenance keeps client email fallback but suppresses duplicate recruiter reminders when Trigger is configured", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance, /proposalAutomationConfigured/);
  assert.match(maintenance, /client_hiring_proposal_followup/);
  assert.match(maintenance, /if \(!proposalAutomationConfigured\(\)\)/);
});
