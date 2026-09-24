import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function source(path) {
  return readFile(path, "utf8");
}

test("training credentials only expose non-revoked certificates for published courses", async () => {
  const lib = await source("src/lib/training-credentials.ts");
  assert.match(lib, /\.from\("training_certificates"\)/);
  assert.match(lib, /\.is\("revoked_at", null\)/);
  assert.match(lib, /\.from\("training_courses"\)/);
  assert.match(lib, /\.eq\("status", "published"\)/);
  assert.doesNotMatch(lib, /training_lesson_progress/);
});

test("VA workspace and private preview show verified training automatically", async () => {
  const profile = await source("src/app/workspace/va/profile/page.tsx");
  const preview = await source("src/app/workspace/va/profile/preview/page.tsx");
  const dashboard = await source("src/app/workspace/va/page.tsx");

  assert.match(profile, /getTrainingCredentialsForUser\(userId\)/);
  assert.match(profile, /heading="Training & certificates"/);
  assert.match(profile, /audience="self"/);
  assert.match(preview, /getTrainingCredentialsForUser\(user\.id\)/);
  assert.match(preview, /heading="Training completed"/);
  assert.match(dashboard, /getTrainingCredentialsForUser\(userId\)/);
});

test("recruiter candidate profiles show training as supporting evidence", async () => {
  const page = await source("src/app/workspace/recruiter/candidates/[id]/page.tsx");
  const component = await source("src/components/training-credentials.tsx");

  assert.match(page, /getTrainingCredentialsForUser\(id\)/);
  assert.match(page, /heading="Verified training & certificates"/);
  assert.match(page, /audience="recruiter"/);
  assert.match(page, /showEmpty/);
  assert.match(component, /does not verify employment history, role experience, or hiring eligibility/);
  assert.match(component, /never required for recruiter approval or client selection/);
});

test("client shortlist training data is fetched only for recruiter-released accessible candidates", async () => {
  const page = await source("src/app/workspace/client/candidates/page.tsx");
  const helper = await source("src/lib/client-hiring-room.ts");
  const migration = await source("supabase/migrations/20260924172000_client_hiring_room_summary.sql");
  const detail = await source("src/app/workspace/client/candidates/[id]/page.tsx");
  const card = await source("src/components/client-shortlist-candidate-card.tsx");

  assert.match(migration, /selected_released/);
  assert.match(migration, /j\.status='published'/);
  assert.match(migration, /a\.access_status in \('paid','comped'\)/);
  assert.match(migration, /from training_certificates tc/);
  assert.match(migration, /where tc\.revoked_at is null/);
  assert.match(helper, /trainingCredentialsByUser/);
  assert.match(page, /trainingCredentials=\{trainingByUser\.get\(row\.va_id\) \|\| \[\]\}/);
  assert.match(detail, /if\(!shortlist\)notFound\(\)/);
  assert.match(detail, /candidateAccessUnlocked/);
  assert.match(detail, /getTrainingCredentialsForUser\(summary\.va_id\)/);
  assert.match(card, /Training completed/);
});

test("profile readiness links point to current profile sections", async () => {
  const completeness = await source("src/lib/profile-completeness.ts");
  const live = await source("src/components/live-profile-strength.tsx");
  const resume = await source("src/components/resume-autofill.tsx");

  assert.match(completeness, /profile#resume/);
  assert.match(completeness, /profile#links/);
  assert.doesNotMatch(completeness, /profile#trust/);
  assert.match(resume, /id="resume"/);
  assert.match(live, /nextHref/);
  assert.match(live, /href=\{state\.nextHref\}/);
});

test("profile save accepts generic MIME resume uploads by validated extension", async () => {
  const action = await source("src/app/actions/profile.ts");
  assert.match(action, /application\/octet-stream/);
  assert.match(action, /mimeByExtension/);
  assert.match(action, /contentType: expectedMime/);
});


test("saved resume can be replaced or removed without exposing storage paths", async () => {
  const page = await source("src/app/workspace/va/profile/page.tsx");
  const component = await source("src/components/resume-autofill.tsx");
  const action = await source("src/app/actions/profile.ts");

  assert.match(page, /savedResumeName/);
  assert.match(page, /replace\(\/\^\\d\+\-\//);
  assert.match(component, /Saved file:/);
  assert.match(component, /removeVaResumeAction/);
  assert.match(component, /Remove saved resume/);
  assert.match(action, /export async function removeVaResumeAction/);
  assert.match(action, /\.update\(\{ resume_path: null \}\)/);
  assert.match(action, /storage\.from\("resumes"\)\.remove/);
});


test("live and server profile readiness use the same core requirements", async () => {
  const completeness = await source("src/lib/profile-completeness.ts");
  const live = await source("src/components/live-profile-strength.tsx");
  const profile = await source("src/app/workspace/va/profile/page.tsx");

  assert.match(completeness, /portfolio_url \|\| p\.linkedin_url/);
  assert.match(live, /hasAvatar \|\| \(avatar instanceof File/);
  assert.match(live, /Choose your VA category", "#expertise"/);
  assert.match(live, /Add at least 3 tools", "#expertise"/);
  assert.match(live, /Number\(fd\.get\("years_experience"\) \|\| 0\) >= 1/);
  assert.doesNotMatch(live, /Add your preferred schedule", "#availability"/);
  assert.match(profile, /hasAvatar=\{Boolean\(profile\.avatar_url\)\}/);
});
