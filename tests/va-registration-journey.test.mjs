import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA email signup and social signup both route into quick setup", async () => {
  const [auth, callback, joinPage] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/auth/callback/route.ts"),
    read("src/app/auth/join/va/page.tsx"),
  ]);

  assert.match(auth, /const fallback = role === "va" \? "\/workspace\/va\/onboarding"/);
  assert.match(auth, /const destination = role \? destinationFor\(role, parsed\.data\.next, parsed\.data\.talent\)/);
  assert.match(auth, /next: destination/);
  assert.match(callback, /requestedRole === "va"/);
  assert.match(callback, /const next = requestedNext \?\? fallback/);
  assert.match(joinPage, /<JoinAccountForm role="va"/);
});

test("VA quick setup saves the essential profile fields then returns to the dashboard", async () => {
  const [page, action] = await Promise.all([
    read("src/app/workspace/va/onboarding/page.tsx"),
    read("src/app/actions/va-onboarding.ts"),
  ]);

  for (const field of ["primary_category", "headline", "years_experience", "weekly_hours", "hourly_rate", "address"]) {
    assert.match(page, new RegExp(`name="${field}"`));
  }
  assert.match(action, /\.from\("va_profiles"\)[\s\S]*?\.update/);
  assert.match(action, /redirect\("\/workspace\/va\?setup=complete"\)/);
});

test("VA profile remains private unless current public-profile consent is granted", async () => {
  const [consent, integrity] = await Promise.all([
    read("src/app/actions/privacy-consent.ts"),
    read("tests/public-va-publish-integrity.test.mjs"),
  ]);

  assert.match(consent, /public_profile_consent/);
  assert.match(consent, /directory_visible: false/);
  assert.match(integrity, /public_profile_consent = true/);
  assert.match(integrity, /completion floor/);
});

test("public job application journey requires recruiter-ready vetting", async () => {
  const job = await read("src/app/jobs/[id]/page.tsx");
  assert.match(job, /Complete vetting to apply/);
  assert.match(job, /Continue vetting/);
  assert.match(job, /Apply for this job/);
  assert.match(job, /approved and bench-vetted VAs/i);
  assert.match(job, /private details stay protected until candidate access is active/i);
});
