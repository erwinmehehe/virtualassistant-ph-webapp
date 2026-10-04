import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("daily maintenance records a non-sensitive completion audit and positive runtime log", async () => {
  const source = await readFile("src/app/api/cron/maintenance/route.ts", "utf8");

  assert.match(source, /action: "maintenance_completed"/);
  assert.match(source, /target_type: "system"/);
  assert.match(source, /target_id: "daily_maintenance"/);
  assert.match(source, /error_tasks: errorTasks/);
  assert.match(source, /deployment_sha: deploymentSha/);
  assert.match(source, /console\.info\("\[maintenance\] completed"/);

  assert.doesNotMatch(source, /maintenance_completed[\s\S]{0,800}(email|recipient|name|token|secret)/i);
});

test("maintenance completion audit never changes task failure isolation", async () => {
  const source = await readFile("src/app/api/cron/maintenance/route.ts", "utf8");

  assert.match(source, /async function runMaintenanceTask/);
  assert.match(source, /return \{ error: message \}/);
  assert.match(source, /const errorTasks = Object\.entries\(result\)/);
  assert.match(source, /ok: errorTasks\.length === 0/);
  assert.match(source, /const ok = errorTasks\.length === 0/);
  assert.match(source, /\{ status: ok \? 200 : 500 \}/);
  assert.match(source, /\{ \.\.\.result, ok, errorTasks \}/);
});
