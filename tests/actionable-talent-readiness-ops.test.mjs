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
  assert.match(filters,/primary_category\.eq/);
  assert.match(filters,/categories\.cs/);
  assert.match(filters,/query\.or/);
  assert.match(filters,/query = query\.contains\("categories", categories\)/);
  assert.match(talent,/name="filter_category"/);
  assert.match(talent,/name="filter_category_match"/);
  assert.match(action,/category: filterValues\(formData, "filter_category"\)/);
  assert.match(action,/category_match: filterValue\(formData, "filter_category_match"\)/);
  assert.match(action,/classification: filterValue\(formData, "filter_classification"\)/);
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


test("VA profile save refreshes the availability confirmation used by client-ready gating", async () => {
  const profile = await read("src/app/actions/profile.ts");
  assert.match(profile, /availability_confirmed_at: new Date\(\)\.toISOString\(\)/);
  assert.match(profile, /availability_status: String\(formData\.get\("availability_status"\)/);
});


test("Work Readiness can scope directly to recruiter-selected candidates for one role", async () => {
  const page = await read("src/app/workspace/recruiter/work-readiness/page.tsx");
  assert.match(page, /const jobId = String\(query\.job \|\| ""\)\.trim\(\)/);
  const loader = await read("src/lib/work-readiness-queue.ts");
  assert.match(page, /getRoleShortlistWorkReadinessQueue\(userId, jobId\)/);
  assert.match(loader, /job_shortlist_candidates/);
  assert.match(loader, /shortlist_status","proposed"/);
  assert.match(loader, /\.not\("created_by","is",null\)/);
  assert.match(page, /Shortlist work readiness/);
  assert.match(page, /All shortlisted/);
  assert.match(page, /Back to role shortlist/);
  assert.match(page, /work_setup_submitted_at/);
});

test("Role Control Center treats current availability as the only operational shortlist blocker after approval", async () => {
  const page = await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  assert.match(page, /Shortlist readiness blockers/);
  assert.match(page, /needsAvailability/);
  assert.doesNotMatch(page, /bulkRecruiterVaAction/);
  assert.doesNotMatch(page, /Add to talent pool/);
  assert.doesNotMatch(page, /need talent-pool membership/);
  assert.doesNotMatch(page, /Open scoped work readiness/);
  assert.doesNotMatch(page, /need verified work setup/);
});
