import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter matching does not gate candidates on overlap or availability confirmation",()=>{
  const action=source("src/app/actions/matching.ts");
  const server=source("src/components/staff-job-matching.tsx");
  const table=source("src/components/matching-candidate-table.tsx");
  const matching=source("src/lib/matching.ts");
  const migration=source("supabase/migrations/20260926123000_remove_matching_availability_overlap_gates.sql");

  assert.doesNotMatch(matching,/Needs .*hours of daily overlap/);
  assert.doesNotMatch(matching,/Availability status is not set/);
  assert.doesNotMatch(action,/AVAILABILITY_FRESH_DAYS/);
  assert.doesNotMatch(action,/fresh availability confirmation before client release/);
  assert.doesNotMatch(server,/releaseReady|releaseBlocker|availabilityCutoff/);
  assert.doesNotMatch(table,/Confirmation needed|Availability confirmation required before client release|selectedReleaseBlocked|Send availability reminder/);
  assert.match(table,/disabled=\{!selectedCount \|\| selectedCount > 5\}/);
  assert.match(migration,/drop trigger if exists shortlist_release_availability_guard/);
  assert.doesNotMatch(migration,/v\.overlap_hours.*j\.overlap_hours/);
});

test("availability remains informational instead of a release prerequisite",()=>{
  const table=source("src/components/matching-candidate-table.tsx");
  const migration=source("supabase/migrations/20260926123000_remove_matching_availability_overlap_gates.sql");

  assert.match(table,/availabilityLabel\(row\.va\.availability_status\)/);
  assert.doesNotMatch(table,/confirmed within the last 14 days/);
  assert.doesNotMatch(migration,/availability_confirmed_at/);
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
