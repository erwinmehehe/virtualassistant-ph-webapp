import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(p)=>readFile(new URL(`../${p}`,import.meta.url),"utf8");

test("bulk profile reminders cannot consume critical email capacity",async()=>{
 const cron=await read("src/app/api/cron/maintenance/route.ts");
 assert.match(cron,/MAX_PROFILE_REMINDERS_PER_RUN = 20/);
 assert.match(cron,/MAX_NONCRITICAL_EMAILS_PER_DAY = 50/);
 assert.match(cron,/email_confirmed_at/);
 assert.match(cron,/skippedUnverified/);
 assert.match(cron,/skippedCapacity/);
});
