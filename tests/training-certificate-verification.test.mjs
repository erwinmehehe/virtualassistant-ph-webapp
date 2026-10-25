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
  assert.match(credentials, /recipient_name/);
  assert.match(credentials, /recipientName/);
  assert.doesNotMatch(credentials, /\.from\("profiles"\)|\.from\("auth.users"\)/);
  assert.doesNotMatch(credentials, /email|phone/);

  assert.match(page, /Certificate of completion/);
  assert.match(page, /Verified/);
  assert.match(page, /Not verified/);
  assert.match(page, /robots:\s*\{ index: false, follow: false \}/);
  assert.match(page, /credential\.recipientName/);
  assert.match(page, /Proudly presented to/);
  assert.doesNotMatch(page, /email|phone/i);
});

test("training evidence links to credential verification", async () => {
  const component = await source("src/components/training-credentials.tsx");
  assert.match(component, /\/training\/certificates\/\$\{encodeURIComponent\(credential\.credentialCode\)\}/);
  assert.match(component, /Verify credential/);
});

test("retired event analytics redirects, but training records and reports remain available", async () => {
  const [analytics, training] = await Promise.all([
    source("src/app/workspace/admin/analytics/page.tsx"),
    source("src/app/workspace/admin/training/page.tsx"),
  ]);
  assert.match(analytics, /redirect\("\/workspace\/admin\/today"\)/);
  assert.doesNotMatch(analytics, /analytics_events/);
  assert.match(training, /Completion within 7 and 14 days/);
  assert.match(training, /Course-level completion bottlenecks/);
});

test("newly issued certificates snapshot recipient name without mutating existing awards", async () => {
  const completion = await source("src/lib/training-completion.ts");
  assert.match(completion, /getUserById\(userId\)/);
  assert.match(completion, /recipient_name: recipientName/);
  assert.match(completion, /if \(!existingCertificate\)/);
});
