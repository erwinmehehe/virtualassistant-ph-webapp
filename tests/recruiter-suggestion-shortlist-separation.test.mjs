import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("automatic match suggestions do not count as recruiter shortlists",async()=>{
  const migration=await read("supabase/migrations/20260927084500_separate_match_suggestions_from_shortlists.sql");
  assert.match(migration,/suggested_count/);
  assert.match(migration,/shortlist_status = 'proposed'\s+and s\.created_by is null/);
  assert.match(migration,/shortlist_status = 'proposed'\s+and s\.created_by is not null/);
  assert.match(migration,/shortlist_status='proposed'\s+and created_by is not null/);
});

test("Roles exposes suggestion shortlist and client-review states separately",async()=>{
  const [roles,summary,clientReview,matching]=await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/lib/recruiter-roles-summary.ts"),
    read("src/app/workspace/recruiter/client-review/page.tsx"),
    read("src/components/staff-job-matching.tsx"),
  ]);
  assert.match(summary,/suggested_count:number/);
  assert.match(summary,/candidate_access_status:string\|null/);
  assert.match(roles,/\["ready_to_send", "Ready to send"\]/);
  assert.match(roles,/\["client_review", "Client review"\]/);
  assert.match(roles,/job\.suggested_count/);
  assert.match(roles,/job\.proposed_count/);
  assert.match(roles,/candidate_access_status/);
  assert.match(clientReview,/view=client_review/);
  assert.match(matching,/Match suggestions/);
  assert.match(matching,/Automatic · not shortlisted/);
  assert.match(matching,/Selected internally/);
});

test("automation alone no longer advances a role to internal review",async()=>{
  const migration=await read("supabase/migrations/20260927084500_separate_match_suggestions_from_shortlists.sql");
  assert.match(migration,/and created_by is not null/);
  assert.match(migration,/v_stage:='internal_review'/);
  assert.match(migration,/perform public\.sync_job_hiring_stage\(r\.id\)/);
});


test("automatic refresh never erases a recruiter-curated shortlist marker",async()=>{
  const autoMatching=await read("src/lib/auto-matching.ts");
  assert.match(autoMatching,/select\("va_id,shortlist_status,created_by"\)/);
  assert.match(autoMatching,/existingRow\.shortlist_status === "proposed" && !existingRow\.created_by/);
  assert.match(autoMatching,/const suggestionCandidates = qualified\.filter/);
  assert.match(autoMatching,/if \(rows\.length\)/);
});
