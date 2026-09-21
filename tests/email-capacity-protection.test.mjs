import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("bulk profile completion email is disabled",async()=>{
 const cron=await readFile(new URL("../src/app/api/cron/maintenance/route.ts",import.meta.url),"utf8");
 assert.doesNotMatch(cron,/sendProfileCompletionReminderEmail/);
 assert.doesNotMatch(cron,/runProfileNudges/);
});


test("routine workflow state changes stay in-app instead of consuming Resend quota", async () => {
  const [email, maintenance, matching, jobs] = await Promise.all([
    readFile(new URL("../src/lib/email.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/cron/maintenance/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/actions/matching.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/actions/jobs.ts", import.meta.url), "utf8"),
  ]);

  assert.match(email, /dashboard_only/);
  assert.match(email, /shortlist presented/);
  assert.doesNotMatch(maintenance, /runStaffReminderDigest/);
  assert.doesNotMatch(matching, /sendVaMatchEmail/);
  assert.doesNotMatch(jobs, /sendTransactionalEventEmail/);
});
