import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("registration health stays recruiter-only and exposes reasons without raw auth email", async () => {
  const migration = await read("supabase/migrations/20260929070000_va_registration_health_and_address_backfill.sql");
  assert.match(migration, /recruiter_va_registration_health/);
  assert.match(migration, /email_unconfirmed/);
  assert.match(migration, /never_started/);
  assert.match(migration, /profile_incomplete/);
  assert.match(migration, /has_private_address/);
  assert.match(migration, /revoke all on public\.recruiter_va_registration_health from public, anon, authenticated/);
  assert.match(migration, /grant select on public\.recruiter_va_registration_health to service_role/);
  assert.doesNotMatch(migration, /au\.email\s+as/);
});

test("Talent exposes exact zero-percent and address rescue queues with bulk-safe filters", async () => {
  const [page, filters, recruiterTalent, recruiter] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/recruiter-talent-filters.ts"),
    read("src/app/actions/recruiter-talent.ts"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(page, /0% \/ not started/);
  assert.match(page, /Email unconfirmed/);
  assert.match(page, /Missing address/);
  assert.match(page, /Resume address review/);
  assert.match(page, /recruiter_va_directory_health/);
  assert.match(page, /registration_health/);
  assert.match(page, /address_resume_status/);
  assert.match(page, /Never started profile/);
  assert.match(page, /Signed in but setup was never started/);
  assert.match(filters, /registration\?: string/);
  assert.match(filters, /address\?: string/);
  assert.match(filters, /registration_health/);
  assert.match(filters, /has_private_address/);
  assert.match(recruiterTalent, /filter_registration/);
  assert.match(recruiterTalent, /filter_address/);
  assert.match(recruiterTalent, /recruiter_va_directory_health/);
  assert.match(recruiter, /filter_registration/);
  assert.match(recruiter, /filter_address/);
  assert.match(recruiter, /recruiter_va_directory_health/);
});

test("maintenance no longer mines resumes for home addresses", async () => {
  const maintenance = await read("src/app/api/cron/maintenance/route.ts");

  assert.doesNotMatch(maintenance, /runVaAddressResumeBackfill/);
  assert.doesNotMatch(maintenance, /va-address-backfill/);
});
