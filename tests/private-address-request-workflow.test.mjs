import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("VA profile and dashboard do not require a home address", async () => {
  const [action, dashboard, profilePage] = await Promise.all([
    read("src/app/actions/profile.ts"),
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/profile/page.tsx"),
  ]);

  assert.doesNotMatch(action, /formData\.get\("address"\)/);
  assert.doesNotMatch(profilePage, /name="address"/);
  assert.doesNotMatch(profilePage, /Current home address/);
  assert.doesNotMatch(dashboard, /title:"Add your address"/);
});

test("recruiter address requests are disabled everywhere", async () => {
  const [action, talent, candidate] = await Promise.all([
    read("src/app/actions/recruiter.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/workspace/recruiter/candidates/[id]/page.tsx"),
  ]);

  assert.doesNotMatch(action.match(/const allowedBulkActions[^\n]+/)?.[0] || "", /request_address/);
  assert.match(action, /Private home-address requests are disabled/);
  assert.doesNotMatch(talent, /<option value="request_address">/);
  assert.doesNotMatch(candidate, /requestVaPrivateAddressAction/);
  assert.doesNotMatch(candidate, /Request address/);
});

test("maintenance no longer extracts addresses from private resumes", async () => {
  const [worker, maintenance] = await Promise.all([
    read("src/lib/va-address-backfill.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
  ]);

  assert.match(worker, /disabled: true/);
  assert.doesNotMatch(worker, /storage\.from\("resumes"\)\.download/);
  assert.doesNotMatch(maintenance, /runVaAddressResumeBackfill/);
  assert.doesNotMatch(maintenance, /VA address resume backfill/);
});

test("deployment closes historical address request notifications", async () => {
  const migration = await read("supabase/migrations/20261003094000_retire_va_address_requests.sql");
  assert.match(migration, /type = 'private_address_request'/);
  assert.match(migration, /done_at = coalesce\(done_at, now\(\)\)/);
});
