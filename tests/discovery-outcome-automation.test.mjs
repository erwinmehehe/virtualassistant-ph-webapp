import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) =>
  readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("all discovery booking paths queue the durable outcome workflow", async () => {
  const [leads, booking, recruiter, helper] = await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/app/actions/booking.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/lib/trigger-automation.ts"),
  ]);

  assert.equal(
    (leads.match(/queueDiscoveryOutcomeAutomation\(/g) || []).length,
    2,
  );
  assert.equal(
    (booking.match(/queueDiscoveryOutcomeAutomation\(/g) || []).length,
    1,
  );
  assert.match(recruiter, /queueDiscoveryOutcomeAutomation\(/);
  assert.match(helper, /vaph-discovery-outcome/);
  assert.match(helper, /discovery-outcome-\$\{leadId\}-\$\{scheduleKey\}/);
});

test("Trigger workflow waits until 45 minutes after call end then escalates two hours later", async () => {
  const source = await read("automations/trigger/src/discovery-outcome.ts");
  assert.match(source, /durationMinutes \* 60_000 \+ 45 \* 60_000/);
  assert.match(source, /wait\.until\(\{ date: outcomeDueAt \}\)/);
  assert.match(source, /wait\.for\(\{ hours: 2 \}\)/);
  assert.match(source, /"outcome_due"/);
  assert.match(source, /"outcome_overdue"/);
});

test("callback is protected, ignores stale reschedules, and creates an idempotent recruiter outcome task", async () => {
  const route = await read(
    "src/app/api/internal/automation/discovery-outcome/route.ts",
  );

  assert.match(route, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(route, /timingSafeSecretMatches/);
  assert.match(route, /stale_schedule/);
  assert.match(route, /discovery_completed_at/);
  assert.match(route, /Discovery outcome due/);
  assert.match(route, /existing/);
  assert.match(route, /outcome_overdue/);
  assert.match(route, /priority.*urgent/s);
});

test("recording an outcome clears the reminder and creates only safe internal next actions", async () => {
  const [ops, recruiter, workspace] = await Promise.all([
    read("src/lib/discovery-outcome-automation.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/app/actions/discovery-workspace.ts"),
  ]);

  assert.match(ops, /Prepare recommendation/);
  assert.match(ops, /Recover no-show/);
  assert.match(ops, /No automatic client email has been sent/);
  assert.doesNotMatch(ops, /sendDiscoveryNoShowRebookEmail/);
  assert.match(recruiter, /ensureDiscoveryOutcomeNextAction/);
  assert.match(workspace, /resolveDiscoveryOutcomeArtifacts/);
});
