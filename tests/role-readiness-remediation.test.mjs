import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("role readiness repair is limited to recruiter/admin and preserves publication state", async () => {
  const action = await read("src/app/actions/agency-role.ts");

  assert.match(action, /saveRoleReadinessDetailsAction/);
  assert.match(action, /requireAnyRole\(\["recruiter", "admin"\]\)/);
  assert.match(action, /job\.recruiter_id !== user\.id/);
  assert.match(action, /publicationMissingDetails\(candidate\)/);
  assert.match(action, /update\(\{ \.\.\.patch, updated_at:/);
  const block = action.slice(action.indexOf("export async function saveRoleReadinessDetailsAction"));
  assert.doesNotMatch(block, /status:\s*"published"/);
});

test("role readiness repair records recruiter activity and admin audit evidence", async () => {
  const action = await read("src/app/actions/agency-role.ts");

  assert.match(action, /action: "role_readiness_completed"/);
  assert.match(action, /action: "job_role_readiness_completed"/);
  assert.match(action, /changed_fields/);
});

test("recruiter and admin role pages expose the same inline repair form", async () => {
  const [recruiter, admin, form] = await Promise.all([
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/admin/jobs/[id]/page.tsx"),
    read("src/components/role-readiness-form.tsx"),
  ]);

  for (const source of [recruiter, admin]) {
    assert.match(source, /RoleReadinessForm/);
    assert.match(source, /saveRoleReadinessDetailsAction/);
    assert.match(source, /role_details_saved/);
    assert.match(source, /role_details_error/);
  }

  assert.match(recruiter, /href="#role-readiness">Complete role details/);
  assert.doesNotMatch(recruiter, /href="#matching">Complete role review/);
  assert.match(form, /publicationMissingDetails\(job\)/);
  assert.match(form, /Add only confirmed client information/);
  assert.match(form, /name="start_timing"/);
  assert.match(form, /name="hours_per_week"/);
  assert.match(form, /name="min_hourly_rate"/);
  assert.match(form, /MIN_HOURLY_RATE/);
});
