import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter shortlist blocks stale availability before client release",()=>{
  const action=source("src/app/actions/matching.ts");
  const server=source("src/components/staff-job-matching.tsx");
  const table=source("src/components/matching-candidate-table.tsx");

  assert.match(action,/AVAILABILITY_FRESH_DAYS = 14/);
  assert.match(action,/fresh availability confirmation before client release/);
  assert.match(action,/availability is stale/);
  assert.match(server,/availabilityCutoff=Date\.now\(\)-14\*24\*60\*60\*1000/);
  assert.match(server,/releaseReady/);
  assert.match(table,/selectedReleaseBlocked/);
  assert.match(table,/Availability confirmation required before client release/);
  assert.match(table,/disabled=\{!selectedCount \|\| selectedCount > 5 \|\| selectedReleaseBlocked\.length > 0\}/);
});

test("recruiter can send a cooldown-safe in-app availability reminder",()=>{
  const action=source("src/app/actions/matching.ts");
  const table=source("src/components/matching-candidate-table.tsx");
  const role=source("src/app/workspace/recruiter/roles/[id]/page.tsx");

  assert.match(action,/export async function remindVaAvailabilityAction/);
  assert.match(action,/Confirm your current availability/);
  assert.match(action,/AVAILABILITY_REMINDER_COOLDOWN_HOURS = 20/);
  assert.match(action,/href: "\/workspace\/va\/profile#availability"/);
  assert.match(table,/Send availability reminder/);
  assert.match(role,/availability_reminded/);
});

test("role control center enforces recruiter ownership with a visible redirect message",()=>{
  const detail=source("src/app/workspace/recruiter/roles/[id]/page.tsx");
  const list=source("src/app/workspace/recruiter/roles/page.tsx");

  assert.match(detail,/const \{ userId \} = await requireRoleFast\("recruiter"\)/);
  assert.match(detail,/job\.recruiter_id && job\.recruiter_id !== userId/);
  assert.match(detail,/This role is assigned to another recruiter/);
  assert.match(list,/params\.error \? <div className="alert" role="alert">\{params\.error\}<\/div>/);
});
