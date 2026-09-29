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

test("Talent exposes exact zero-percent and private-address rescue queues with bulk-safe filters", async () => {
  const [page, filters, recruiterTalent, recruiter] = await Promise.all([
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/lib/recruiter-talent-filters.ts"),
    read("src/app/actions/recruiter-talent.ts"),
    read("src/app/actions/recruiter.ts"),
  ]);

  assert.match(page, /0% \/ not started/);
  assert.match(page, /Email unconfirmed/);
  assert.match(page, /Missing private address/);
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

test("resume address backfill only auto-saves explicit high-confidence addresses", async () => {
  const [parser, worker, maintenance] = await Promise.all([
    read("src/lib/resume-parsing.ts"),
    read("src/lib/va-address-backfill.ts"),
    read("src/app/api/cron/maintenance/route.ts"),
  ]);

  assert.match(parser, /extractResumeAddressCandidate/);
  assert.match(parser, /confidence: "high"/);
  assert.match(parser, /confidence: "review"/);
  assert.match(worker, /candidate\.confidence === "high"/);
  assert.match(worker, /candidate\.confidence === "review" \? "review" : "no_match"/);
  assert.match(worker, /address_resume_status: status/);
  
  assert.match(worker, /address_resume_status: "unsupported"/);
  assert.match(worker, /address_resume_status: "error"/);
  assert.match(worker, /storage\.from\("resumes"\)\.download/);
  assert.match(maintenance, /runVaAddressResumeBackfill\(8\)/);
});
