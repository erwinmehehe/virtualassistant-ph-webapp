import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("abandoned incomplete VA accounts are purged after 10 days with hiring safeguards",async()=>{
 const cron=await readFile(new URL("../src/app/api/cron/maintenance/route.ts",import.meta.url),"utf8");
 assert.match(cron,/ABANDONED_VA_DAYS = 10/);
 assert.match(cron,/runAbandonedVaCleanup/);
 assert.match(cron,/\.lt\("completion_score", 100\)/);
 assert.match(cron,/va_vetting/);
 assert.match(cron,/\["approved", "bench"\]/);
 assert.match(cron,/applications/);
 assert.match(cron,/workrooms/);
 assert.match(cron,/placement_offers/);
 assert.match(cron,/admin\.auth\.admin\.deleteUser\(userId\)/);
 assert.doesNotMatch(cron,/runStaleVaCleanup/);
});
