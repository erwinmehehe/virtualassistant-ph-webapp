import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Bench is consolidated into Talent and removed from recruiter navigation",async()=>{
  const [nav,bench,talent]=await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/bench/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx")
  ]);
  assert.doesNotMatch(nav,/\["Bench", "\/workspace\/recruiter\/bench"/);
  assert.match(bench,/redirect\("\/workspace\/recruiter\/talent\?view=bench&sort=recent"\)/);
  assert.match(talent,/Bench \/ active pool/);
  assert.match(talent,/filters: \{ stage: "bench" \}/);
});

test("Stalled work is consolidated into Roles needs-intervention queue",async()=>{
  const [nav,stalled,roles]=await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/stalled/page.tsx"),
    read("src/app/workspace/recruiter/roles/page.tsx")
  ]);
  assert.doesNotMatch(nav,/\["Stalled", "\/workspace\/recruiter\/stalled"/);
  assert.match(stalled,/redirect\("\/workspace\/recruiter\/roles\?view=intervention&sort=urgent"\)/);
  assert.match(roles,/Needs intervention/);
  assert.match(roles,/clientOverdue/);
  assert.match(roles,/job\.interview_overdue/);
  assert.match(roles,/job\.offer_overdue/);
  assert.match(roles,/noCandidates/);
});

test("filtered Talent bulk actions hard-stop above 500 results",async()=>{
  const [action,page]=await Promise.all([
    read("src/app/actions/recruiter-talent.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx")
  ]);
  assert.match(action,/count: "exact", head: true/);
  assert.match(action,/Number\(filteredCount \|\| 0\) > RECRUITER_BULK_LIMIT/);
  assert.match(action,/Filtered bulk actions are limited to \$\{RECRUITER_BULK_LIMIT\} VAs/);
  assert.match(page,/Filtered bulk unavailable/);
  assert.match(page,/disabled=\{total > RECRUITER_BULK_LIMIT\}/);
  assert.doesNotMatch(page,/Select first 500 filtered VAs/);
});

test("all VA approval actions enforce the shared 60 percent completion floor",async()=>{
  const [admin,vetting,recruiter,visibility]=await Promise.all([
    read("src/app/actions/admin.ts"),
    read("src/app/actions/vetting.ts"),
    read("src/app/actions/recruiter.ts"),
    read("src/lib/public-visibility.ts")
  ]);
  assert.match(visibility,/APPROVAL_MIN_COMPLETION = 60/);
  assert.match(recruiter,/rows\.filter\(isRowApprovable\)/);
  assert.match(admin,/gte\("completion_score", APPROVAL_MIN_COMPLETION\)/);
  assert.match(vetting,/assertApprovalCompletion\(completion\)/);
});
