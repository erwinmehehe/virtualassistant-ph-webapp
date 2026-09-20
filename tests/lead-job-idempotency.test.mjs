import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("lead job creation is idempotent and database-enforced",async()=>{
  const [actions,migration]=await Promise.all([
    read("src/app/actions/leads.ts"),
    read("supabase/migrations/20260920143000_prevent_duplicate_lead_jobs.sql")
  ]);
  assert.match(actions,/\.from\("lead_intake"\)[\s\S]*\.select\("job_id"\)[\s\S]*\.eq\("id", args\.leadId\)/);
  assert.match(actions,/\.from\("jobs"\)[\s\S]*\.eq\("lead_id", args\.leadId\)/);
  assert.match(actions,/if \(existingLead\?\.job_id\) return/);
  assert.match(actions,/if \(existingJob\?\.id\)/);
  assert.match(migration,/unique index if not exists jobs_one_job_per_lead_idx/);
  assert.match(migration,/on public\.jobs \(lead_id\)/);
  assert.match(migration,/where lead_id is not null/);
});
