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
  assert.match(profile, /heading="Your completed training"/);
  assert.match(preview, /getTrainingCredentialsForUser\(user\.id\)/);
  assert.match(preview, /heading="Training completed"/);
  assert.match(dashboard, /getTrainingCredentialsForUser\(userId\)/);
});

test("recruiter candidate profiles show training as supporting evidence", async () => {
  const page = await source("src/app/workspace/recruiter/candidates/[id]/page.tsx");
  const component = await source("src/components/training-credentials.tsx");

  assert.match(page, /getTrainingCredentialsForUser\(id\)/);
  assert.match(page, /heading="Verified training completed"/);
  assert.match(component, /Training is supporting evidence only/);
  assert.match(component, /not required for recruiter approval or client selection/);
});

test("client shortlist training data is fetched only for recruiter-released accessible candidates", async () => {
  const page = await source("src/app/workspace/client/candidates/page.tsx");
  const detail = await source("src/app/workspace/client/candidates/[id]/page.tsx");
  const card = await source("src/components/client-shortlist-candidate-card.tsx");

  assert.match(page, /releasedVaIds=selectedPublished&&selectedAccessUnlocked/);
  assert.match(page, /getTrainingCredentialsForUsers\(releasedVaIds\)/);
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
