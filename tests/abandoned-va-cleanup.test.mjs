import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("abandoned incomplete VA accounts require a grace queue and final eligibility check before purge",async()=>{
 const [cron,migration]=await Promise.all([
  readFile(new URL("../src/app/api/cron/maintenance/route.ts",import.meta.url),"utf8"),
  readFile(new URL("../supabase/migrations/20261004143000_conversion_hardening.sql",import.meta.url),"utf8"),
 ]);
 assert.match(cron,/ABANDONED_VA_DAYS = 10/);
 assert.match(cron,/ABANDONED_VA_PURGE_GRACE_DAYS = 7/);
 assert.match(cron,/runAbandonedVaCleanup/);
 assert.match(cron,/\.lt\("completion_score", 100\)/);
 assert.match(cron,/va_vetting/);
 assert.match(cron,/\["approved", "bench"\]/);
 assert.match(cron,/applications/);
 assert.match(cron,/workrooms/);
 assert.match(cron,/placement_offers/);
 assert.match(cron,/va_account_cleanup_queue/);
 assert.match(cron,/can_purge_abandoned_va/);
 assert.match(cron,/final abandoned VA eligibility check failed/);
 assert.match(cron,/admin\.auth\.admin\.deleteUser\(userId\)/);
 assert.match(migration,/create table if not exists public\.va_account_cleanup_queue/);
 assert.match(migration,/create or replace function public\.can_purge_abandoned_va/);
 assert.match(migration,/grant execute on function public\.can_purge_abandoned_va\(uuid, timestamptz\) to service_role/);
 assert.doesNotMatch(cron,/runStaleVaCleanup/);
});
