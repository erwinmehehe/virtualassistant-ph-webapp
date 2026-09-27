import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("approve and publish only enables visibility for genuinely public-ready consented VAs",async()=>{
  const action=await read("src/app/actions/recruiter.ts");
  assert.match(action,/isPubliclyEligible/);
  assert.match(action,/const publicReadyIds/);
  assert.match(action,/directory_visible: true/);
  assert.match(action,/directory_visible: false/);
  assert.match(action,/publicReadySet/);
  assert.doesNotMatch(action,/setting it on a profile that falls short is harmless/);
});

test("public VA directory requires an active account and the current 80 percent completion floor",async()=>{
  const migration=await read("supabase/migrations/20260927094500_align_public_va_directory_with_80_percent_policy.sql");
  assert.match(migration,/p\.account_status = 'active'/);
  assert.match(migration,/\) >= 80;/);
  assert.doesNotMatch(migration,/\) >= 75;/);
  assert.match(migration,/public_profile_consent = true/);
  assert.match(migration,/public_profile_consent_version = '2026-09-12-v1'/);
});

test("bulk publish warning includes consent instead of stale blocker wording",async()=>{
  const page=await read("src/app/workspace/recruiter/talent/page.tsx");
  assert.match(page,/public-profile requirements or current publication consent are incomplete/);
  assert.doesNotMatch(page,/availability, experience, rate, photo, or profile-completion requirements/);
});
