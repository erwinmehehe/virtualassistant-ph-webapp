import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("public credential verification exposes only valid published-course credentials", async () => {
  const credentials = await source("src/lib/training-credentials.ts");
  const page = await source("src/app/training/certificates/[code]/page.tsx");

  assert.match(credentials, /getPublicTrainingCredentialByCode/);
  assert.match(credentials, /\.eq\("credential_code", credentialCode\)/);
  assert.match(credentials, /\.is\("revoked_at", null\)/);
  assert.match(credentials, /\.eq\("status", "published"\)/);
  assert.doesNotMatch(credentials, /full_name|email|phone/);

  assert.match(page, /Certificate of completion/);
  assert.match(page, /Verified/);
  assert.match(page, /Not verified/);
  assert.match(page, /robots:\s*\{ index: false, follow: false \}/);
  assert.doesNotMatch(page, /learner name|full_name|email|phone/i);
});

test("training evidence links to credential verification", async () => {
  const component = await source("src/components/training-credentials.tsx");
  assert.match(component, /\/training\/certificates\/\$\{encodeURIComponent\(credential\.credentialCode\)\}/);
  assert.match(component, /Verify credential/);
});

test("admin analytics calculates training conversion stages and largest drop-off", async () => {
  const analytics = await source("src/app/workspace/admin/analytics/page.tsx");

  assert.match(analytics, /trainingParticipantCount/);
  assert.match(analytics, /trainingConversionStages/);
  assert.match(analytics, /Accounts created/);
  assert.match(analytics, /Assessment submissions/);
  assert.match(analytics, /Course completions/);
  assert.match(analytics, /Largest measured drop-off/);
  assert.match(analytics, /% of previous stage/);
  assert.match(analytics, /Lesson completions remain an activity count/);
});
