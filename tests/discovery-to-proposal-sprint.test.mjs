import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("the Discovery hub opens unresolved outcomes first and leaves closed leads out", async () => {
  const [hub, css] = await Promise.all([
    read("src/app/workspace/recruiter/discovery/page.tsx"),
    read("src/app/workspace/recruiter/discovery/discovery.module.css"),
  ]);
  assert.match(hub, /const requested = String\(params\.view \|\| "action"\)/);
  assert.match(hub, /const view = VIEWS\.some\(\(\[value\]\) => value === requested\) \? requested : "action"/);
  assert.match(hub, /\["won", "lost", "nurture"\]/);
  assert.match(hub, /needsOutcome \? "Record call outcome"/);
  assert.match(hub, /#discovery-booking/);
  assert.match(hub, /#client-followup/);
  assert.match(hub, /Do not mark a client qualified without a real conversation/);
  assert.match(css, /\.actionNotice/);
});

test("call outcome form requires a deliberate choice and qualified calls reach the recommendation", async () => {
  const [page, action] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/app/actions/recruiter.ts"),
  ]);
  assert.match(page, /id="discovery-booking"/);
  assert.match(page, /defaultValue="" required><option value="" disabled>Choose what actually happened/);
  assert.doesNotMatch(page, /option value="rescheduled">Rescheduled<\/option>/);
  const completion = action.slice(
    action.indexOf("export async function completeDiscoveryAction"),
    action.indexOf("export async function sendDiscoveryNoShowRebookAction"),
  );
  assert.match(completion, /const outcome = String\(formData\.get\("outcome"\) \|\| ""\)\.trim\(\)/);
  assert.match(completion, /Use Reschedule discovery to save a new client-local date and time/);
  assert.match(completion, /outcome === "qualified" && profile\.role === "recruiter"/);
  assert.match(completion, /discovery\?discovery_completed=1/);
});

test("proposal draft exists before the lead advances to qualified", async () => {
  const action = await read("src/app/actions/discovery-workspace.ts");
  const draftFirst = action.indexOf("// Commit the internal draft before changing the lead to qualified");
  const stageWrite = action.indexOf('if (intent !== "save") {');
  assert.ok(draftFirst >= 0 && stageWrite > draftFirst, "draft must be written first");
  assert.match(action, /const \{ data: latestProposal, error: existingProposalError \}/);
  assert.match(action, /\["sent", "accepted"\]\.includes\(String\(latestProposal\.status\)\)/);
  assert.match(action, /if \(latestProposal && \["draft", "changes_requested"\]/);
  assert.match(action, /proposal\?generated=1/);
});

test("follow-up and nurture never pretend a discovery call was attended", async () => {
  const [action, ui] = await Promise.all([
    read("src/app/actions/discovery-workspace.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
  ]);
  assert.match(action, /const leadPatch: Record<string, unknown> = \{\s*next_follow_up_at: nextFollowUpAt/);
  assert.match(action, /if \(intent !== "follow_up"\) \{/);
  assert.match(action, /if \(intent === "proposal"\) \{\s*leadPatch\.discovery_completed_at/);
  assert.match(action, /leadPatch\.discovery_outcome = "qualified"/);
  assert.doesNotMatch(action, /discovery_outcome: intent === "proposal" \? "qualified" : "attended"/);
  assert.match(ui, /Follow-up and nurture save a next step; they do not mark a call attended/);
});

test("CRM attention queue includes missing follow-up and overdue outcomes", async () => {
  const [pipeline, detail] = await Promise.all([
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);
  assert.match(pipeline, /function discoveryOutcomeOverdue/);
  assert.match(pipeline, /function missingFollowupPlan/);
  assert.match(pipeline, /discovery_cancelled_at/);
  assert.match(pipeline, /Record discovery outcome/);
  assert.match(pipeline, /Set follow-up date/);
  assert.match(pipeline, /#crm-settings/);
  assert.match(detail, /id="crm-settings"/);
  assert.match(detail, /id="discovery-booking"/);
});

test("optional compensation is never silently turned into zero in client proposals", async () => {
  const actions = await read("src/app/actions/proposals.ts");
  assert.match(actions, /const raw = String\(value \?\? ""\)\.trim\(\)/);
  assert.match(actions, /if \(!raw\) return null/);
  assert.match(actions, /salaryMin: numberValue\(formData\.get\("salary_min"\)\)/);
  assert.match(actions, /salaryMax: numberValue\(formData\.get\("salary_max"\)\)/);
});

test("recoverable training checkpoint errors are reported without the learner's answer", async () => {
  const [gate, endpoint] = await Promise.all([
    read("src/components/training-lesson-integrity-gate.tsx"),
    read("src/app/api/errors/route.ts"),
  ]);
  assert.match(gate, /name: "TrainingCheckpointActionError"/);
  assert.match(gate, /source: "training_checkpoint_recoverable"/);
  assert.match(gate, /message: "Training checkpoint answer was not saved"/);
  assert.match(gate, /path: window\.location\.pathname/);
  assert.match(endpoint, /body\?\.source === "training_checkpoint_recoverable"/);
  assert.match(endpoint, /source,/);
  assert.doesNotMatch(gate, /optionId: selectedOption,[\s\S]{0,180}body: JSON\.stringify/);
});
