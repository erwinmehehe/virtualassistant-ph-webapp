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

test("matching refresh never runs every VA in one database statement", async () => {
  const source = await readFile("src/app/api/cron/maintenance/route.ts", "utf8");
  const matching = source.slice(
    source.indexOf("async function runPendingJobMatching"),
    source.indexOf("type ReminderSubject", source.indexOf("async function runPendingJobMatching")),
  );

  assert.match(source, /const MATCH_REFRESH_CONCURRENCY = 4/);
  assert.match(source, /const MATCH_REFRESH_MAX_VAS = 500/);
  assert.match(matching, /\.in\("stage", \["approved", "bench"\]\)/);
  assert.match(matching, /\.order\("va_id", \{ ascending: true \}\)/);
  assert.match(matching, /MATCH_REFRESH_MAX_VAS \+ 1/);
  assert.match(matching, /admin\.rpc\("refresh_match_suggestions_for_va", \{ p_va_id: row\.va_id \}\)/);
  assert.match(matching, /await Promise\.all\(batch\.map/);
  assert.match(matching, /if \(failed\) \{/);
  assert.match(matching, /throw new Error\(`Match refresh failed/);
  assert.doesNotMatch(matching, /refresh_all_match_suggestions/);
  assert.doesNotMatch(matching, /candidatesReleased: [1-9]/);
});

test("daily maintenance bounds database concurrency and invalidates expired public job caches", async () => {
  const source = await readFile("src/app/api/cron/maintenance/route.ts", "utf8");
  assert.match(source, /const MAINTENANCE_MAX_CONCURRENCY = 6/);
  assert.match(source, /const limitMaintenance = createMaintenanceLimiter\(MAINTENANCE_MAX_CONCURRENCY\)/);
  assert.ok((source.match(/limitMaintenance\(\(\) => runMaintenanceTask/g) || []).length >= 15);
  assert.match(source, /revalidateTag\("public-jobs", "max"\)/);
  assert.match(source, /revalidateTag\("public-job-details", "max"\)/);
});

test("recruiters invalidate public caches when archiving a job", async () => {
  const source = await readFile("src/app/actions/recruiter.ts", "utf8");
  const close = source.slice(
    source.indexOf("export async function closeRecruiterRoleAction"),
    source.indexOf("export async function completeDiscoveryAction"),
  );
  assert.match(close, /select\("id,title,status,slug"\)/);
  assert.match(close, /updateTag\("public-jobs"\)/);
  assert.match(close, /updateTag\("public-job-details"\)/);
  assert.match(close, /revalidatePath\("\/jobs"\)/);
});
