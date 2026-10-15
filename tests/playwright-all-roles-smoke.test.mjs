import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (p) => readFile(new URL("../" + p, import.meta.url), "utf8");

test("all workspace roles, shared training, client success and public visitors are represented", async () => {
  const body = await read("e2e/all-roles-smoke.spec.ts");
  for (const role of ["public", "client", "va", "recruiter", "admin", "learner", "client-success"]) {
    assert.match(body, new RegExp('role: "' + role + '"'));
  }
  assert.match(body, /name: "desktop"/);
  assert.match(body, /name: "mobile"/);
  assert.match(body, /work-readiness/);
  assert.match(body, /foundations-course/);
  assert.match(body, /primary link navigation/);
});

test("screenshots and failures use local-only isolated data and avoid persistence of credentials", async () => {
  const [suite, seed] = await Promise.all([
    read("e2e/all-roles-smoke.spec.ts"),
    read("scripts/seed-e2e-users.mjs"),
  ]);
  assert.match(suite, /function assertIsolatedEnvironment/);
  assert.match(suite, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(suite, /E2E_BASE_URL/);
  assert.match(suite, /isLoopbackUrl\(app\) \|\| !isLoopbackUrl\(database\)/);
  assert.match(seed, /E2E account provisioning is restricted to an isolated loopback Supabase database/);
  assert.match(seed, /email: "admin.e2e@example.test", role: "admin"/);
  assert.doesNotMatch(suite, /auth\.admin\.createUser|SUPABASE_SERVICE_ROLE_KEY|page\.fill\(["'].*(credit|card|bank)/);
});

test("role smoke checks JS failures, browser console, server responses, overflow, images and labels", async () => {
  const suite = await read("e2e/all-roles-smoke.spec.ts");
  for (const signal of [
    'page.on("pageerror"',
    'page.on("console"',
    'page.on("response"',
    "horizontalOverflowPx",
    "primaryHeadingClipped",
    "brokenImages",
    "missingAlt",
    "unnamedControls",
    "frameworkErrorOverlay",
    "errorBoundary",
    'page.screenshot({ path: screenshotPath',
  ]) {
    assert.ok(suite.includes(signal), "Missing smoke signal: " + signal);
  }
});

test("CI uploads isolated smoke evidence even when Playwright fails", async () => {
  const [workflow, pkg] = await Promise.all([
    read(".github/workflows/browser-db-contracts.yml"),
    read("package.json"),
  ]);
  assert.match(workflow, /npx playwright test/);
  assert.match(workflow, /name: Upload all-roles smoke evidence[\s\S]*?if: always\(\)/);
  assert.match(workflow, /path: artifacts\/all-roles-smoke/);
  assert.match(workflow, /retention-days: 14/);
  assert.equal(JSON.parse(pkg).scripts["smoke:roles"], "playwright test e2e/all-roles-smoke.spec.ts --project=chromium");
});
