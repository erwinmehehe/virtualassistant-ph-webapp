import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

async function currentGuardMigrationSource(){
  const dir=new URL("../supabase/migrations/",import.meta.url);
  const files=await readdir(dir);
  const name=files.find((file)=>file.endsWith("_align_shortlist_release_with_hiring_brief.sql"));
  assert.ok(name,"missing current shortlist release guard migration");
  return readFile(new URL(name,dir),"utf8");
}

test("client shortlist release uses the same brief requirements as the server action",async()=>{
  const action=await read("src/app/actions/matching.ts");
  assert.match(action,/publicationMissingDetails/);
  assert.match(action,/mode === "release"/);
  assert.match(action,/Complete the role brief before sending candidates to the client/);
});

test("database shortlist release guard matches the public hiring brief instead of legacy role readiness",async()=>{
  const migration=await currentGuardMigrationSource();
  assert.match(migration,/create or replace function public\.enforce_client_visible_shortlist/);
  assert.match(migration,/char_length\(btrim\(coalesce\(j\.summary/);
  assert.match(migration,/cardinality\(coalesce\(j\.responsibilities/);
  assert.match(migration,/j\.min_hourly_rate is not null/);
  assert.doesNotMatch(migration,/cardinality\(coalesce\(j\.required_skills/);
  assert.doesNotMatch(migration,/j\.hours_per_week is not null/);
  assert.doesNotMatch(migration,/btrim\(coalesce\(j\.timezone/);
  assert.doesNotMatch(migration,/btrim\(coalesce\(j\.start_timing/);
  assert.match(migration,/c\.commercial_status = 'accepted'/);
  assert.match(migration,/a\.access_status in \('paid', 'comped'\)/);
  assert.match(migration,/set search_path = ''/);
  assert.match(migration,/revoke all on function public\.enforce_client_visible_shortlist\(\)/);
});
