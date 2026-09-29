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


test("profiles that stop being VAs are removed from active shortlists",()=>{
  const migration=source("supabase/migrations/20260929185400_hide_non_va_shortlist_rows.sql");
  assert.match(migration,/hide_shortlists_when_va_role_removed/);
  assert.match(migration,/after update of role on public\.profiles/);
  assert.match(migration,/shortlist_status in \('proposed','released'\)/);
  assert.match(migration,/set shortlist_status = 'hidden'/);
  assert.match(migration,/p\.role <> 'va'::public\.user_role/);
  assert.match(migration,/revoke execute on function private\.hide_shortlists_when_va_role_removed\(\) from public, anon, authenticated/);
});


test("client-facing matching uses explicit client-ready talent health",()=>{
  const helper=source("src/lib/client-ready-talent.ts");
  const action=source("src/app/actions/matching.ts");
  const server=source("src/components/staff-job-matching.tsx");

  assert.match(helper,/CLIENT_READY_MIN_COMPLETION = 80/);
  assert.match(helper,/registration_health === "ready"/);
  assert.match(helper,/email_confirmed === true/);
  assert.match(helper,/has_resume === true/);
  assert.match(helper,/availability_status === "available"/);
  assert.doesNotMatch(helper,/has_private_address/);
  assert.match(action,/recruiter_va_directory_health/);
  assert.match(action,/isClientReadyTalent/);
  assert.match(action,/not client-ready/);
  assert.match(server,/client-ready VAs assessed/);
  assert.match(server,/held back by profile health/);
});
