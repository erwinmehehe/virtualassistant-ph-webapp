import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
test("maintenance never emails VAs just to complete their profile",async()=>{
 const cron=await readFile(new URL("../src/app/api/cron/maintenance/route.ts",import.meta.url),"utf8");
 assert.doesNotMatch(cron,/sendProfileCompletionReminderEmail/);
 assert.doesNotMatch(cron,/runProfileNudges/);
 assert.doesNotMatch(cron,/MAX_PROFILE_REMINDERS/);
});
