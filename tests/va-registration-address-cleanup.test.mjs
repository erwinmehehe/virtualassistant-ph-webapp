import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("registration health stays recruiter-only and excludes raw auth email", async () => {
  const migration = await read("supabase/migrations/20260929070000_va_registration_health_and_address_backfill.sql");
  assert.match(migration, /recruiter_va_registration_health/);
  assert.match(migration, /email_unconfirmed/);
  assert.match(migration, /never_started/);
  assert.match(migration, /profile_incomplete/);
  assert.match(migration, /revoke all on public\.recruiter_va_registration_health from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.recruiter_va_registration_health to service_role/);
  assert.doesNotMatch(migration, /au\.email\s+as/);
});

test("Talent keeps profile rescue tools but cannot request a VA home address", async () => {
  const [page, recruiter] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(page, /0% \/ not started/);
  assert.match(page, /Email unconfirmed/);
  assert.match(page, /Missing resume/);
  assert.doesNotMatch(page, /<option value="request_address">/);
  assert.doesNotMatch(recruiter.match(/const allowedBulkActions[^\n]+/)?.[0] || "", /request_address/);
});

test("resume address extraction is a disabled compatibility shim", async () => {
  const [worker, maintenance] = await Promise.all([
    read("src/lib/va-address-backfill.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
  ]);

  assert.match(worker, /VAPH no longer derives or auto-saves a VA's home address/);
  assert.match(worker, /disabled: true/);
  assert.doesNotMatch(worker, /extractResumeAddressCandidate/);
  assert.doesNotMatch(maintenance, /runVaAddressResumeBackfill/);
});
