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


test("matching defaults to agency-certified client-ready talent and blocks near-ready selection", async () => {
  const [matching, table] = await Promise.all([
    read("src/components/staff-job-matching.tsx"),
    read("src/components/matching-candidate-table.tsx"),
  ]);
  assert.match(matching, /isTalentAgencyCertified/);
  assert.match(matching, /talentReadinessActions/);
  assert.match(matching, /bench_memberships/);
  assert.match(matching, /clientReadyCount/);
  assert.match(matching, /row\.clientReady&&row\.score>=60/);
  assert.match(table, /selectionBlocked/);
  assert.match(table, /Not client-ready yet/);
  assert.match(table, /Strongest client-ready candidates first|strongest client-ready candidates first/i);
  assert.match(table, /row\.clientReady\)/);
  assert.match(table, /\["proposed", "released"\]/);
});


test("role queues only mark fully client-ready human shortlists as ready to send", async () => {
  const [migration, roles, summary, detail] = await Promise.all([
    read("supabase/migrations/20260929233000_recruiter_shortlist_readiness_queue.sql"),
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/lib/recruiter-roles-summary.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  assert.match(migration, /client_ready_proposed_count/);
  assert.match(migration, /blocked_proposed_count/);
  assert.match(migration, /availability_confirmed_at >= now\(\) - interval '30 days'/);
  assert.match(migration, /work_setup_verified_at is not null/);
  assert.match(summary, /client_ready_proposed_count:number/);
  assert.match(summary, /blocked_proposed_count:number/);
  assert.match(roles, /\["shortlist_blocked", "Shortlist blocked"\]/);
  assert.match(roles, /job\.client_ready_proposed_count===job\.proposed_count/);
  assert.match(roles, /job\.blocked_proposed_count>0/);
  assert.match(detail, /shortlist_status === "proposed" && Boolean\(x\.created_by\)/);
  assert.match(detail, /Fix shortlist readiness/);
  assert.match(detail, /isTalentAgencyCertified/);
});


test("quick shortlist preparation only chooses client-ready talent", async () => {
  const action = await read("src/app/actions/matching.ts");
  assert.match(action, /isTalentAgencyCertified/);
  assert.match(action, /bench_memberships/);
  assert.match(action, /activePoolIds/);
  assert.match(action, /availabilityConfirmedAt: va\.availability_confirmed_at/);
  assert.doesNotMatch(action, /workSetupVerifiedAt: va\.work_setup_verified_at/);
  assert.match(action, /No client-ready 60%\+ matches are available yet/);
});


test("role readiness blockers support one bulk talent-pool action without auto-verifying evidence", async () => {
  const detail = await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  assert.match(detail, /poolBlockedIds/);
  assert.match(detail, /Add \{poolBlockedIds\.length\} to talent pool/);
  assert.doesNotMatch(detail, /workSetupBlockedCount/);
  assert.doesNotMatch(detail, /need verified work setup/);
  assert.doesNotMatch(detail, /work_setup_verified_at:\s*new Date/);
});
