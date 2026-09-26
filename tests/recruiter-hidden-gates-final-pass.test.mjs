import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("recruiter roles are team-wide while ownership stays visible",async()=>{
  const [page,migration]=await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("supabase/migrations/20260926151000_align_recruiter_matching_and_team_roles.sql")
  ]);
  assert.doesNotMatch(migration,/where j\.recruiter_id = p_recruiter_id/);
  assert.match(migration,/cross join actor/);
  assert.match(page,/job\.recruiter_id===userId\?"My role":job\.recruiter_id\?"Team role":"Unassigned"/);
});

test("experience rate and availability no longer act as hidden match gates",async()=>{
  const [matching,action,migration]=await Promise.all([
    read("src/lib/matching.ts"),
    read("src/app/actions/matching.ts"),
    read("supabase/migrations/20260926151000_align_recruiter_matching_and_team_roles.sql")
  ]);

  assert.doesNotMatch(action,/remindVaAvailabilityAction|AVAILABILITY_REMINDER_COOLDOWN_HOURS/);
  assert.doesNotMatch(migration,/minimum_years_experience is not null and coalesce\(v\.years_experience,0\) < j\.minimum_years_experience then continue/);
  assert.doesNotMatch(migration,/max_hourly_rate is not null and v\.hourly_rate is not null and v\.hourly_rate > j\.max_hourly_rate then continue/);
  assert.match(migration,/if j\.minimum_years_experience is not null then/);
  assert.match(migration,/if j\.max_hourly_rate is not null and v\.hourly_rate is not null then/);
  assert.doesNotMatch(migration,/v\.availability_status = 'available'/);
  assert.match(matching,/Experience is below the stated preference/);
  assert.match(matching,/Rate is above the stated client budget/);
});

test("client release readiness includes candidate access instead of failing after click",async()=>{
  const server=await read("src/components/staff-job-matching.tsx");
  assert.match(server,/candidateAccessUnlocked/);
  assert.match(server,/job_candidate_access/);
  assert.match(server,/candidateAccessReady/);
  assert.match(server,/commercial\?\.commercial_status==="accepted"&&candidateAccessReady/);
  assert.match(server,/Candidate access is not active yet/);
});
