import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("recruiter roles loads one scoped summary RPC instead of table fan-out",async()=>{
  const [page,loader,migration]=await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/lib/recruiter-roles-summary.ts"),
    read("supabase/migrations/20260922222848_recruiter_roles_summary.sql"),
  ]);
  assert.match(page,/getRecruiterRolesSummary\(userId\)/);
  assert.doesNotMatch(page,/createAdminClient/);
  for(const table of ["jobs","recruiter_va_directory","job_shortlist_candidates","candidate_interviews","placement_offers","workrooms","job_commercials"]){
    assert.doesNotMatch(page,new RegExp(`\\.from\\("${table}"\\)`),`roles page should not query ${table} directly`);
  }
  assert.match(loader,/withServerTiming\("recruiter\.roles_summary"/);
  assert.match(loader,/admin\.rpc\("recruiter_roles_summary"/);
  assert.match(migration,/security invoker/i);
  assert.match(migration,/p\.id = p_recruiter_id/);
  assert.match(migration,/p\.role::text = 'recruiter'/);
  assert.match(migration,/j\.recruiter_id = p_recruiter_id/);
  assert.match(migration,/revoke all on function public\.recruiter_roles_summary\(uuid\) from public/);
  assert.match(migration,/revoke all on function public\.recruiter_roles_summary\(uuid\) from authenticated/);
  assert.match(migration,/grant execute on function public\.recruiter_roles_summary\(uuid\) to service_role/);
});

test("recruiter roles keeps action queues dominant and preserves saved views",async()=>{
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  for(const label of ["Needs candidates","Waiting on client","Needs intervention","Ready for offer"]){
    assert.match(page,new RegExp(label));
  }
  assert.match(page,/view=needs_candidates&sort=urgent/);
  assert.match(page,/view=waiting_client&sort=urgent/);
  assert.match(page,/view=intervention&sort=urgent/);
  assert.match(page,/view=ready_offer&sort=urgent/);
  assert.match(page,/ROLE_VIEWS/);
  assert.match(page,/requestedView==="history"/);
  assert.match(page,/Talent coverage/);
});

test("summary payload preserves recruiter role state inputs",async()=>{
  const migration=await read("supabase/migrations/20260922222848_recruiter_roles_summary.sql");
  for(const field of [
    "proposed_count",
    "released_count",
    "active_shortlist_count",
    "released_pass_count",
    "unanswered_released_count",
    "oldest_unanswered_released_at",
    "active_interview_count",
    "interview_overdue",
    "active_offer_count",
    "offer_overdue",
    "placement_created",
    "commercial_status",
  ]){
    assert.match(migration,new RegExp(field));
  }
});
