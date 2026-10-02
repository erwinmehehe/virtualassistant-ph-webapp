import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("retention automation is limited to Day 3, 7, 14, and 30", async () => {
  const source = await read("src/lib/placement-retention-automation.ts");
  assert.match(source, /\["day3", "day7", "day14", "day30"\]/);
  assert.doesNotMatch(source, /"day60".*"day90"/s);
});

test("yellow and red placement pulses create one Client Success retention task", async () => {
  const source = await read("src/lib/placement-retention-automation.ts");
  assert.match(source, /Placement retention ·/);
  assert.match(source, /urgent recovery/);
  assert.match(source, /review concern/);
  assert.match(source, /priority = hasRed \? "urgent" : "high"/);
  assert.match(source, /assignee_id: room\.client_success_owner_id/);
  assert.match(source, /subject_type: "job"/);
  assert.match(source, /existing\?\.id/);
});

test("healthy green-green signals close stale retention work", async () => {
  const source = await read("src/lib/placement-retention-automation.ts");
  assert.match(source, /checkin\.client_signal === "green"/);
  assert.match(source, /checkin\.va_signal === "green"/);
  assert.match(source, /await resolveRetentionTask\(args\.admin, room\.job_id\)/);
  assert.match(source, /action: "healthy"/);
});

test("missing response is escalated only after the check-in is 24 hours overdue", async () => {
  const source = await read("src/lib/placement-retention-automation.ts");
  assert.match(source, /overdueMs >= 24 \* 60 \* 60 \* 1000/);
  assert.match(source, /response overdue/);
  assert.match(source, /still needs/);
});

test("participant and Client Success check-in actions sync retention recovery immediately", async () => {
  const actions = await read("src/app/actions/agency-operations-v2.ts");
  const matches = actions.match(/syncPlacementRetentionRecovery/g) || [];
  assert.ok(matches.length >= 3, "expected import plus both pulse paths");
  assert.match(actions, /workroomId: room\.id, checkinId/);
  assert.match(actions, /workroomId, checkinId/);
});

test("maintenance sweeps overdue retention checkpoints without changing participant responses", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance, /runPlacementRetentionRecovery/);
  assert.match(maintenance, /\.in\("checkpoint", \["day3", "day7", "day14", "day30"\]\)/);
  assert.match(maintenance, /placement retention recovery/);
  assert.doesNotMatch(maintenance, /client_signal: "green"/);
  assert.doesNotMatch(maintenance, /va_signal: "green"/);
});

test("retention work starts only after formal handoff and belongs to Client Success", async () => {
  const source = await read("src/lib/placement-retention-automation.ts");
  assert.match(source, /!room\.handoff_completed_at/);
  assert.match(source, /!room\.client_success_owner_id/);
  assert.match(source, /client_success_owner_id/);
  assert.match(source, /\/workspace\/client-success\/\$\{room\.id\}/);
});
