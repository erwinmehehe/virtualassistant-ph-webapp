import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read=(path)=>readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("smoke VAs remain above the shared approval completion floor",()=>{
  const route=read("src/app/api/internal/github-smoke-auth/route.ts");
  assert.match(route,/skills: \["Data Entry", "Email Management", "Calendar Management", "Research", "CRM Administration"\]/);
  assert.match(route,/tools: \["Google Workspace", "Slack", "Microsoft 365"\]/);
  assert.match(route,/Dedicated non-public automated QA profile used only to verify recruiter and client workflows safely in production/);
});

test("stale VA availability is blocked before client shortlist release",()=>{
  const action=read("src/app/actions/matching.ts");
  const table=read("src/components/matching-candidate-table.tsx");
  assert.match(action,/availabilityCutoff = Date\.now\(\) - 14 \* 24 \* 60 \* 60 \* 1000/);
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
  assert.match(actions,/This role is assigned to another recruiter/);
});
