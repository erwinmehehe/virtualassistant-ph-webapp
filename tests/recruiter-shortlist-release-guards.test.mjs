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

test("recruiter assignment is ownership metadata, not a role access gate",()=>{
  const detail=source("src/app/workspace/recruiter/roles/[id]/page.tsx");
  const matching=source("src/app/actions/matching.ts");
  const agencyRole=source("src/app/actions/agency-role.ts");

  assert.match(detail,/requireRoleFast\("recruiter"\)/);
  assert.match(detail,/staffMap\.get\(job\.recruiter_id\) \|\| "Unassigned"/);
  for (const content of [detail, matching, agencyRole]) {
    assert.doesNotMatch(content,/This role is assigned to another recruiter/);
    assert.doesNotMatch(content,/job\.recruiter_id && job\.recruiter_id !==/);
  }
});
