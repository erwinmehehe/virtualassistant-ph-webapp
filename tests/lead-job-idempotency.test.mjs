import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("lead job creation is idempotent, shared, and database-enforced",async()=>{
  const [actions,helper,migration]=await Promise.all([
    read("src/app/actions/leads.ts"),
    read("src/lib/lead-role.ts"),
    read("supabase/migrations/20260920143000_prevent_duplicate_lead_jobs.sql")
  ]);
  assert.match(actions,/ensurePendingRoleForLead/);
  assert.doesNotMatch(actions,/function createPendingJobForLead|async function createPendingJobForLead/);
  assert.match(helper,/\.from\("lead_intake"\)[\s\S]*\.select\("job_id"\)[\s\S]*\.eq\("id", args\.leadId\)/);
  assert.match(helper,/\.from\("jobs"\)[\s\S]*\.eq\("lead_id", args\.leadId\)/);
  assert.match(helper,/if \(existingLead\?\.job_id\) return/);
  assert.match(helper,/if \(existingJob\?\.id\)/);
  assert.match(helper,/\.update\(\{ job_id: existingJob\.id/);
  assert.match(helper,/recruiter_id/);
  assert.match(helper,/error\.code === "23505"/);
  assert.match(migration,/unique index if not exists jobs_one_job_per_lead_idx/);
  assert.match(migration,/on public\.jobs \(lead_id\)/);
  assert.match(migration,/where lead_id is not null/);
});
