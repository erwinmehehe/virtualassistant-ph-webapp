import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("owner role-readiness escalation only crosses the intended thresholds", async () => {
  const { adminRoleReadinessNeedsAttention, roleReadinessMissingLabel } = await import("../src/lib/role-readiness-policy.ts");

  assert.equal(adminRoleReadinessNeedsAttention({ recruiter_id:null, service_model:"curated_placement", age_hours:2 }), true);
  assert.equal(adminRoleReadinessNeedsAttention({ recruiter_id:"recruiter-1", service_model:"managed_service", age_hours:2 }), true);
  assert.equal(adminRoleReadinessNeedsAttention({ recruiter_id:"recruiter-1", service_model:"curated_placement", age_hours:72 }), true);
  assert.equal(adminRoleReadinessNeedsAttention({ recruiter_id:"recruiter-1", service_model:"curated_placement", age_hours:71 }), false);
  assert.equal(roleReadinessMissingLabel("start timing"), "preferred start");
  assert.equal(roleReadinessMissingLabel("budget"), "VA budget");
});

test("role-readiness dashboard queue is computed from current jobs without creating reminder records", async () => {
  const helper = await read("src/lib/role-readiness-dashboard.ts");
  assert.match(helper, /\.from\("jobs"\)/);
  assert.match(helper, /publicationMissingDetails\(job\)/);
  assert.match(helper, /\.in\("status",\["pending","published"\]\)/);
  assert.doesNotMatch(helper, /\.insert\(/);
  assert.doesNotMatch(helper, /\.update\(/);
  assert.doesNotMatch(helper, /recruiter_tasks|workflow_reminders/);
});

test("Recruiter My Day treats incomplete briefs as live hiring work and can request client details", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page, /getRoleReadinessDashboard\(userId\)/);
  assert.match(page, /Complete blocked role briefs/);
  assert.match(page, /Missing role details/);
  assert.match(page, /id="role-readiness"/);
  assert.match(page, /Request client details/);
  assert.match(page, /requestClientRoleDetailsAction/);
  assert.match(page, /this item disappears automatically when the brief is complete/);
  assert.match(page, /role_details_requested/);
  assert.match(page, /role_details_complete/);
});

test("Owner Today only adds escalated incomplete briefs to owner attention", async () => {
  const page = await read("src/app/workspace/admin/today/page.tsx");
  assert.match(page, /getRoleReadinessDashboard\(null\)/);
  assert.match(page, /incompleteRoles\.filter\(adminRoleReadinessNeedsAttention\)/);
  assert.match(page, /kind:"role_details"/);
  assert.match(page, /Incomplete role briefs/);
  assert.match(page, /Unassigned, 72h\+ old, or admin-sensitive/);
  assert.match(page, /ownerAttention=Number\(summary\.owner_attention\|\|0\)\+readinessEscalations\.length/);
  assert.doesNotMatch(page, /\/workspace\/recruiter\//);
});
