import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("database blocks new approvals below the 80 percent completion floor",async()=>{
  const migration=await read("supabase/migrations/20260927090000_enforce_va_approval_completion_floor.sql");
  assert.match(migration,/enforce_va_approval_completion_floor/);
  assert.match(migration,/new\.stage in \('approved','bench'\)/);
  assert.match(migration,/old\.stage not in \('approved','bench'\)/);
  assert.match(migration,/completion_score/);
  assert.match(migration,/v_completion,0\) < 80/);
  assert.match(migration,/before insert or update of stage on public\.va_vetting/);
});

test("already approved VAs can still be reviewed or moved within approved bench states",async()=>{
  const migration=await read("supabase/migrations/20260927090000_enforce_va_approval_completion_floor.sql");
  assert.match(migration,/old\.stage is null\s+or old\.stage not in \('approved','bench'\)/);
  assert.doesNotMatch(migration,/old\.stage in \('approved','bench'\).*raise exception/s);
});

test("bulk client review uses the same five-candidate cap as the shortlist workflow",async()=>{
  const action=await read("src/app/actions/recruiter-talent.ts");
  assert.match(action,/const CLIENT_SHORTLIST_LIMIT = 5/);
  assert.match(action,/selected\.length > CLIENT_SHORTLIST_LIMIT/);
  assert.match(action,/ids\.length > CLIENT_SHORTLIST_LIMIT/);
  assert.doesNotMatch(action,/Send at most 50 VAs/);
  assert.doesNotMatch(action,/more than 50 VAs/);
});
