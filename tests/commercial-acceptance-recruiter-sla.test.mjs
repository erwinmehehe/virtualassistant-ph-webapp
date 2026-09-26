import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

async function migrationSource(){
  const dir=new URL("../supabase/migrations/",import.meta.url);
  const files=await readdir(dir);
  const name=files.find((file)=>file.endsWith("_commercial_acceptance_recruiter_sla.sql"));
  assert.ok(name,"missing commercial acceptance recruiter SLA migration");
  return readFile(new URL(name,dir),"utf8");
}

test("accepted commercial terms create idempotent recruiter sourcing SLA tasks",async()=>{
  const migration=await migrationSource();

  assert.match(migration,/create or replace function public\.create_commercial_acceptance_recruiter_sla/);
  assert.match(migration,/new\.commercial_status = 'accepted'/);
  assert.match(migration,/old\.commercial_status is distinct from 'accepted'/);
  assert.match(migration,/public\.default_recruiter_id\(\)/);
  assert.match(migration,/Start sourcing and review matches/);
  assert.match(migration,/First client-ready shortlist due/);
  assert.match(migration,/interval '2 hours'/);
  assert.match(migration,/interval '24 hours'/);
  assert.match(migration,/\/workspace\/recruiter\/roles\//);
  assert.match(migration,/on conflict do nothing/);
  assert.match(migration,/create trigger commercial_acceptance_recruiter_sla/);
});

test("commercial acceptance SLA migration backfills only open accepted roles",async()=>{
  const migration=await migrationSource();

  assert.match(migration,/commercial_status = 'accepted'/);
  assert.match(migration,/j\.status <> 'closed'/);
  assert.match(migration,/where not exists/);
  assert.match(migration,/subject_type = 'job'/);
  assert.match(migration,/status = 'todo'/);
});
