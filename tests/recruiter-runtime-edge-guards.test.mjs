import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("stale VA availability is blocked before client shortlist release",()=>{
  const action=read("src/app/actions/matching.ts");
  const table=read("src/components/matching-candidate-table.tsx");
  assert.match(action,/const AVAILABILITY_FRESH_DAYS = 14/);
  assert.match(action,/availabilityCutoff = Date\.now\(\) - AVAILABILITY_FRESH_DAYS \* 24 \* 60 \* 60 \* 1000/);
  assert.match(action,/must reconfirm availability before client release/);
  assert.match(action,/includes\("VA availability is stale"\)/);
  assert.match(table,/releaseReady\?: boolean/);
  assert.match(table,/selectedReleaseBlocked = selectedRows\.filter\(\(row\) => row\.releaseReady === false\)/);
  assert.match(table,/selectedReleaseBlocked\.length > 0/);
  assert.match(table,/Availability confirmation required before client release/);
  assert.match(table,/Confirmation needed/);
  assert.match(table,/Send availability reminder/);
});

test("recruiter commercial actions stay on the canonical role workspace",()=>{
  const actions=read("src/app/actions/agency-role.ts");
  assert.doesNotMatch(actions,/workspace\/recruiter\/matching/);
  assert.match(actions,/workspace\/recruiter\/roles/);
  assert.doesNotMatch(actions,/This role is assigned to another recruiter/);
  assert.doesNotMatch(actions,/job\.recruiter_id && job\.recruiter_id !==/);
});
