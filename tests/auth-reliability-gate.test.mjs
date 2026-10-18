import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  AUTH_HEALTH_ISSUE_MARKER,
  evaluateAuthChallengeHealth,
} from "../scripts/auth-security-health-monitor.mjs";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("auth monitor stays healthy below the three separate alert thresholds", () => {
  assert.equal(evaluateAuthChallengeHealth({ total: 41, infrastructure: 2, rejected: 14, missing: 25 }).healthy, true);
  assert.equal(evaluateAuthChallengeHealth({ total: 2, infrastructure: 0, rejected: 0, missing: 2 }).reason, "within_threshold");
});

test("multiple provider/config failures, rejected tokens or missing tokens raise alerts", () => {
  for (const [counts, reason] of [
    [{ total: 3, infrastructure: 3, rejected: 0, missing: 0 }, "infrastructure_threshold"],
    [{ total: 15, infrastructure: 0, rejected: 15, missing: 0 }, "rejected_token_threshold"],
    [{ total: 30, infrastructure: 0, rejected: 0, missing: 30 }, "missing_token_threshold"],
  ]) {
    const result = evaluateAuthChallengeHealth(counts);
    assert.equal(result.healthy, false);
    assert.equal(result.reason, reason);
  }
});

test("failed monitoring is not mistakenly reported as a clean bill of health", () => {
  assert.equal(evaluateAuthChallengeHealth(null).reason, "monitor_unavailable");
  assert.equal(evaluateAuthChallengeHealth({ infrastructure: NaN }).counts.infrastructure, 0);
});

test("Turnstile signals contain fixed categories, never customer data", async () => {
  const [turnstile, telemetry, script] = await Promise.all([
    read("src/lib/turnstile.ts"),
    read("src/lib/auth-challenge-health.ts"),
    read("scripts/auth-security-health-monitor.mjs"),
  ]);
  assert.match(turnstile, /recordAuthChallengeFailure/);
  // Only the official dummy keys in a local development test may override
  // Cloudflare's synthetic action. Real action and token validation remain strict.
  assert.match(turnstile, /function allowIsolatedDummyAction/);
  assert.match(turnstile, /process\.env\.VAPH_AUTH_GATE !== "true"/);
  assert.match(turnstile, /process\.env\.NODE_ENV !== "development"/);
  assert.match(turnstile, /process\.env\.VERCEL_ENV/);
  assert.match(turnstile, /args\.observedAction !== "test"/);
  assert.match(turnstile, /loopbackUrls\.every\(isLoopbackHttpUrl\)/);
  assert.match(turnstile, /expectedAction && result\.action !== expectedAction/);
  assert.match(turnstile, /!allowIsolatedDummyAction/);
  assert.match(telemetry, /event_name: "auth_security_check_failed"/);
  assert.match(telemetry, /session_id: null/);
  assert.match(telemetry, /user_id: null/);
  assert.match(telemetry, /AbortSignal\.timeout\(1_500\)/);
  assert.match(script, /default_transaction_read_only=on/);
  assert.match(script, /AUTH_HEALTH_ISSUE_TITLE/);
  assert.match(AUTH_HEALTH_ISSUE_MARKER, /vaph-auth-challenge-health/);
  assert.doesNotMatch(telemetry, /formData|rawEmail|console\.log\(token|remoteip/);
  assert.doesNotMatch(script, /console\.log\(.*PGPASSWORD/);
});

test("protected training login and recovery are mandatory in isolated browser CI", async () => {
  const [workflow, journey, smoke] = await Promise.all([
    read(".github/workflows/browser-db-contracts.yml"),
    read("e2e/auth-turnstile-gate.spec.ts"),
    read("scripts/production-browser-smoke.mjs"),
  ]);
  assert.match(workflow, /VAPH_AUTH_GATE: "true"/);
  assert.match(workflow, /auth-turnstile-gate\.spec\.ts/);
  assert.match(workflow, /VAPH_AUTH_E2E_TURNSTILE_SITE_KEY/);
  assert.match(workflow, /VAPH_AUTH_E2E_TURNSTILE_SECRET_KEY/);
  // Public Cloudflare dummy pair makes the isolated gate runnable even before
  // optional GitHub Actions test-only variables have been configured.
  assert.match(workflow, /1x00000000000000000000AA/);
  assert.match(workflow, /1x0000000000000000000000000000000AA/);
  assert.match(journey, /Refusing to run auth gate against a remote service/);
  assert.match(journey, /requireIsolatedAuthGate\(\)/);
  assert.match(journey, /page\.locator\("\.auth-alert"\)/);
  assert.match(journey, /page\.locator\("\.success-banner"\)/);
  // A pre-existing confirm=1 URL is not evidence that the Resend action finished.
  // Require its own visible server-action response without an old auth error.
  assert.match(journey, /visibleSuccess: await page\.locator\("\.success-banner"\)\.isVisible\(\)/);
  assert.match(journey, /staleAlert: await page\.locator\("\.auth-alert"\)\.count\(\) > 0/);
  assert.match(journey, /trainingIntent: url\.searchParams\.get\("next"\) === TRAINING/);
  assert.match(journey, /expect\.poll/);
  assert.doesNotMatch(journey, /getByRole\("alert"\)/);
  assert.match(journey, /email confirmation activates disposable learner/);
  assert.match(journey, /failed password followed by valid password/);
  assert.match(journey, /password reset uses a fresh protected challenge/);
  assert.match(journey, /missing verification token is rejected/);
  assert.match(smoke, /\/auth\/login\?next=%2Fworkspace%2Ftraining/);
  assert.match(smoke, /\/auth\/forgot/);
  assert.match(smoke, /\/auth\/join\/training/);
});

test("email confirmation route redirects within the browser origin without dropping session cookies", async () => {
  const route = await read("src/app/auth/confirm/route.ts");
  const journey = await read("e2e/auth-turnstile-gate.spec.ts");
  assert.match(route, /import \{ redirect \} from "next\/navigation"/);
  assert.match(route, /redirect\(destination\)/);
  assert.doesNotMatch(route, /NextResponse\.redirect\(new URL\([^\n]*url\.origin/);
  assert.match(journey, /url\.origin === browserOrigin && url\.pathname === TRAINING/);
});

test("health workflow monitors aggregate failures without production credentials in source", async () => {
  const workflow = await read(".github/workflows/auth-security-health-alert.yml");
  assert.match(workflow, /cron: "\*\/10 \* \* \* \*"/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /scripts\/auth-security-health-monitor\.mjs/);
  assert.match(workflow, /secrets\.SUPABASE_DB_URL/);
  assert.doesNotMatch(workflow, /SUPABASE_DB_URL: postg/);
});
