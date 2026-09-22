import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("public VA directory requires current active versioned consent", async()=>{
  const [helper,migration]=await Promise.all([
    read("src/lib/public-visibility.ts"),
    read("supabase/migrations/20260922041324_enforce_public_va_consent_in_directory.sql")
  ]);
  assert.match(helper,/PUBLIC_PROFILE_CONSENT_VERSION/);
  assert.match(helper,/public_profile_consent_withdrawn_at/);
  assert.match(migration,/v\.public_profile_consent = true/);
  assert.match(migration,/v\.public_profile_consent_at is not null/);
  assert.match(migration,/v\.public_profile_consent_withdrawn_at is null/);
  assert.match(migration,/v\.public_profile_consent_version = '2026-09-12-v1'/);
});

test("new consent enables discovery switch and withdrawal disables it", async()=>{
  const action=await read("src/app/actions/privacy-consent.ts");
  assert.match(action,/current\?\.public_profile_consent/);
  assert.match(action,/directory_visible: true/);
  assert.match(action,/directory_visible: false/);
});

test("talent directory exposes saved queues sorting counts and real public blockers", async()=>{
  const page=await read("src/app/workspace/recruiter/talent/page.tsx");
  assert.match(page,/SAVED_VIEWS/);
  assert.match(page,/Approval-ready/);
  assert.match(page,/Missing photo/);
  assert.match(page,/Approved but hidden/);
  assert.match(page,/Stale 60d\+/);
  assert.match(page,/Needs recruiter review/);
  assert.match(page,/savedViewCounts/);
  assert.match(page,/Recently active/);
  assert.match(page,/Highest completion/);
  assert.match(page,/Most experience/);
  assert.match(page,/Consent needed/);
  assert.match(page,/publicVisibilityRequirements/);
});

test("recruiter roles expose saved action queues with counts and sorting", async()=>{
  const page=await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page,/Needs candidates/);
  assert.match(page,/Waiting on client/);
  assert.match(page,/Stale 72h\+/);
  assert.match(page,/Needs replacements/);
  assert.match(page,/Ready for offer/);
  assert.match(page,/viewCounts/);
  assert.match(page,/Oldest unresolved/);
});

test("recruiter candidate profile shows consent and public eligibility explicitly", async()=>{
  const page=await read("src/app/workspace/recruiter/candidates/[id]/page.tsx");
  assert.match(page,/candidate-overview-card/);
  assert.match(page,/Public consent/);
  assert.match(page,/candidate-public-card/);
  assert.match(page,/visibilityRequirements/);
  assert.match(page,/Consent active/);
  assert.match(page,/PUBLIC_PROFILE_CONSENT_VERSION/);
});

test("recruiter view preference persists last view and sort client-side", async()=>{
  const component=await read("src/components/recruiter-view-preference.tsx");
  assert.match(component,/localStorage\.setItem/);
  assert.match(component,/localStorage\.getItem/);
  assert.match(component,/router\.replace/);
});
