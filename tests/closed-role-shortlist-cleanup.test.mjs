import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("closing or filling a role archives unreleased proposed candidates",async()=>{
  const migration=await read("supabase/migrations/20260927003000_archive_proposed_shortlists_on_role_close.sql");
  assert.match(migration,/archive_proposed_shortlist_when_role_closes/);
  assert.match(migration,/after update of status, hiring_stage on public\.jobs/);
  assert.match(migration,/new\.status::text = 'closed'/);
  assert.match(migration,/new\.hiring_stage, ''\) in \('closed', 'filled'\)/);
  assert.match(migration,/shortlist_status = 'hidden'/);
  assert.match(migration,/shortlist_status = 'proposed'/);
});

test("migration repairs stale proposed candidates on already closed roles",async()=>{
  const migration=await read("supabase/migrations/20260927003000_archive_proposed_shortlists_on_role_close.sql");
  assert.match(migration,/update public\.job_shortlist_candidates s/);
  assert.match(migration,/from public\.jobs j/);
  assert.match(migration,/j\.status::text = 'closed'/);
  assert.match(migration,/coalesce\(j\.hiring_stage, ''\) in \('closed', 'filled'\)/);
});
