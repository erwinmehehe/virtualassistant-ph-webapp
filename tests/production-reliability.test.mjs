import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("suppressed email is not reported as sent",async()=>{
  const email=await read("src/lib/email.ts");
  assert.match(email,/sent: false as const, data: null, suppressed: true/);
  assert.match(email,/return delivery\.sent \? \{ sent: true as const \} : \{ sent: false as const, reason: delivery\.reason \}/);
  assert.equal((email.match(/const delivery = await trackedSend\(/g)||[]).length,23);
});

test("maintenance isolates independent jobs and preserves auth when storage cleanup fails",async()=>{
  const cron=await read("src/app/api/cron/maintenance/route.ts");
  assert.match(cron,/runMaintenanceTask\("lead claim nudges"/);
  assert.doesNotMatch(cron,/runMaintenanceTask\("discovery reminders"/);
  assert.match(cron,/runMaintenanceTask\("pending job matching"/);
  assert.match(cron,/if \(storageCleanupFailed\) \{/);
  assert.match(cron,/storageCleanupFailures\+\+/);
});
