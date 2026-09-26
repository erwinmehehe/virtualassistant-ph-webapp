import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

async function migrationSource(){
  const dir=new URL("../supabase/migrations/",import.meta.url);
  const files=await readdir(dir);
  const name=files.find((file)=>file.endsWith("_shortlist_role_readiness_guard.sql"));
  assert.ok(name,"missing shortlist role readiness guard migration");
  return readFile(new URL(name,dir),"utf8");
}

test("client shortlist release requires a complete role brief in the server action",async()=>{
  const action=await read("src/app/actions/matching.ts");
  assert.match(action,/publicationMissingDetails/);
  assert.match(action,/mode === "release"/);
  assert.match(action,/Complete the role brief before sending candidates to the client/);
});

test("database shortlist release guard blocks incomplete published roles",async()=>{
  const migration=await migrationSource();
  assert.match(migration,/create or replace function public\.enforce_client_visible_shortlist/);
  assert.match(migration,/cardinality\(coalesce\(j\.required_skills/);
  assert.match(migration,/cardinality\(coalesce\(j\.responsibilities/);
  assert.match(migration,/char_length\(btrim\(coalesce\(j\.summary/);
  assert.match(migration,/j\.hours_per_week is null/);
  assert.match(migration,/btrim\(coalesce\(j\.timezone/);
  assert.match(migration,/j\.min_hourly_rate is null/);
  assert.match(migration,/btrim\(coalesce\(j\.start_timing/);
  assert.match(migration,/Role brief is incomplete for client shortlist release/);
  assert.match(migration,/revoke all on function public\.enforce_client_visible_shortlist\(\)/);
});
