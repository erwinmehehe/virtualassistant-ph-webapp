import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production learner smoke is explicitly manual, gated and account-scoped", async () => {
  const [script, workflow] = await Promise.all([
    readFile("scripts/production-training-learner-smoke.mjs", "utf8"),
    readFile(".github/workflows/production-training-learner-smoke.yml", "utf8"),
  ]);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /dedicated_test_account:/);
  assert.match(workflow, /default: false/);
  assert.match(workflow, /PRODUCTION_TEST_LEARNER_EMAIL:/);
  assert.match(workflow, /PRODUCTION_TEST_LEARNER_PASSWORD:/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.doesNotMatch(workflow, /\bschedule\s*:/);
  assert.doesNotMatch(workflow, /SUPABASE_SERVICE_ROLE_KEY|env pull|download-artifact|upload-artifact/);

  assert.match(script, /consent !== "dedicated-test-account-only"/);
  assert.ok(script.includes('const baseUrl = "https://virtualassistant.com.ph";'));
  assert.match(script, /Quick check complete\./);
  assert.match(script, /Ready to complete this lesson\?/);
  assert.match(script, /page\.waitForURL/);
  assert.match(script, /Mobile next-lesson page has horizontal overflow/);
  assert.doesNotMatch(script, /createUser|deleteUser|storageState|addCookies|\.screenshot\(|auth\.admin|service_role/);
});
