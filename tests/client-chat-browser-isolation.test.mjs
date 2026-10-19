import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("real chat and ban security acceptance is isolated without disabling production throttles", async () => {
  const workflow = await readFile(new URL("../.github/workflows/browser-db-contracts.yml", import.meta.url), "utf8");
  const isolated = workflow.indexOf("Isolated chat and Auth-ban acceptance");
  const reset = workflow.indexOf("Reset disposable auth-login counters before browser journeys");
  const journeys = workflow.indexOf("Run browser journeys");
  assert.ok(isolated > 0 && isolated < reset && reset < journeys);
  assert.match(workflow, /npx playwright test e2e\/client-chat-auth-ban-acceptance\.spec\.ts --project=chromium --workers=1 --retries=0/);
  assert.match(workflow, /auth-turnstile-gate\.spec\.ts --project=chromium --workers=1 --retries=1/);
  assert.match(workflow, /@127\.0\.0\.1:54322/);
  assert.match(workflow, /action_key IN \('auth_login:ip', 'auth_login:email'\)/);
  // The shell command must be in a YAML block scalar: otherwise #919 becomes a YAML comment.
  assert.match(workflow, /- name: Run browser journeys\n\s+run: \|\n\s+npx playwright test --grep-invert "PR #919 real chat and Auth-ban acceptance"/);
  assert.doesNotMatch(workflow, /VAPH_DISABLE_AUTH_RATE_LIMIT|AUTH_BYPASS|DISABLE_RATE_LIMIT/);
});
