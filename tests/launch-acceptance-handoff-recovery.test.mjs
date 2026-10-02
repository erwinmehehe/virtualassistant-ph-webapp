import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("formal handoff immediately sweeps overdue retention checkpoints", async () => {
  const actions = await read("src/app/actions/agency-operations-v2.ts");
  const start = actions.indexOf("export async function completeRecruiterHandoffAction");
  assert.notEqual(start, -1, "completeRecruiterHandoffAction must exist");
  const source = actions.slice(start, start + 7000);
  assert.match(source, /handoff_completed_at: now/);
  assert.match(source, /syncPlacementRetentionRecovery\(\{ admin, workroomId \}\)/);
});

test("daily maintenance escalates active placements whose formal handoff is more than 24 hours overdue", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");
  assert.match(maintenance, /async function runPlacementHandoffRecovery/);
  assert.match(maintenance, /\.eq\("status", "active"\)/);
  assert.match(maintenance, /\.is\("handoff_completed_at", null\)/);
  assert.match(maintenance, /\.lte\("created_at", cutoff\)/);
  assert.match(maintenance, /ensurePlacementHandoffAction/);
  assert.match(maintenance, /urgent: true/);
  assert.match(maintenance, /placement handoff recovery/);
  assert.match(maintenance, /placementHandoffRecovery: handoffRecoveryResult/);
});

test("launch preflight fails closed when durable Trigger automations are inactive or incomplete", async () => {
  const preflight = await read("scripts/check-runtime-config.mjs");
  assert.match(preflight, /TRIGGER_SECRET_KEY/);
  assert.match(preflight, /AUTOMATION_CALLBACK_SECRET/);
  assert.match(preflight, /TRIGGER_AUTOMATIONS_ACTIVE/);
  assert.match(preflight, /name: "TRIGGER_AUTOMATIONS"/);
  assert.match(preflight, /triggerAutomationsActive === "1"/);
  assert.match(preflight, /inactive; set TRIGGER_AUTOMATIONS_ACTIVE=1/);
});
