import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Roles talent coverage drills into exact primary specialties",async()=>{
  const [roles,talent,filters,action]=await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/recruiter-talent-filters.ts"),
    read("src/app/actions/recruiter-talent.ts")
  ]);
  assert.match(roles,/talent\?category=/);
  assert.match(roles,/Source for/);
  assert.match(roles,/Review thin pool/);
  assert.match(filters,/query\.eq\("primary_category", category\)/);
  assert.match(talent,/filter_category: effective\.category/);
  assert.match(action,/category: filterValue\(formData, "filter_category"\)/);
});

test("Work Readiness prioritizes ready incomplete and overdue queues with one simple evidence filter",async()=>{
  const [page,loader,migration]=await Promise.all([
    read("src/app/workspace/recruiter/work-readiness/page.tsx"),
    read("src/lib/work-readiness-queue.ts"),
    read("supabase/migrations/20260922230014_workspace_ops_readiness_funnel.sql"),
  ]);
  assert.match(page,/Ready to verify/);
  assert.match(page,/Incomplete/);
  assert.match(page,/Overdue 5d\+/);
  assert.match(page,/overdueCutoff/);
  assert.match(page,/getWorkReadinessQueue\(userId\)/);
  assert.match(page,/requireAnyRoleFast\(\["recruiter", "admin"\]\)/);
  assert.match(page,/PublicAvatar/);
  assert.match(page,/missingFilter === "internet"/);
  assert.match(page,/missingFilter === "power"/);
  assert.match(page,/missingFilter === "equipment"/);
  assert.doesNotMatch(page,/Waiting age/);
  assert.doesNotMatch(page,/name="age"/);
  assert.match(loader,/withServerTiming\("recruiter\.work_readiness"/);
  assert.match(loader,/admin\.rpc\("work_readiness_queue"/);
  assert.match(migration,/security invoker/i);
  assert.match(migration,/p\.role::text in \('recruiter','admin'\)/);
  assert.match(migration,/grant execute on function public\.work_readiness_queue\(uuid,integer\) to service_role/);
});

test("Work Readiness bulk verify and reminders are guarded",async()=>{
  const [page,action,select]=await Promise.all([
    read("src/app/workspace/recruiter/work-readiness/page.tsx"),
    read("src/app/actions/work-readiness.ts"),
    read("src/components/work-readiness-bulk-select.tsx")
  ]);
  assert.match(page,/id="work-readiness-bulk"/);
  assert.match(page,/Verify complete selected/);
  assert.match(page,/Send in-app reminder to incomplete selected/);
  assert.match(page,/form="work-readiness-bulk" name="va_id"/);
  assert.match(select,/Select visible/);
  assert.match(action,/requireAnyRoleFast\(\["recruiter", "admin"\]\)/);
  assert.match(action,/ids\.length > 100/);
  assert.match(action,/workSetupComplete\(row\)/);
  assert.match(action,/type: "work_setup_incomplete"/);
  assert.match(action,/Date\.now\(\) - 7 \* 86400000/);
  assert.match(action,/work_setup_reminder_sent/);
  assert.doesNotMatch(action,/sendTransactionalEventEmail/);
});
