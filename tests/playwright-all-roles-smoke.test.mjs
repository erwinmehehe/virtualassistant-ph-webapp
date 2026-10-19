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
  assert.ok(body.includes("name: /^Log in(?: to training)?$/"), "Training login has a distinct submit-button label");
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
    'page.on("requestfailed"',
    "horizontalOverflowPx",
    "primaryHeadingClipped",
    "brokenImages",
    "missingAlt",
    "unnamedControls",
    "frameworkErrorOverlay",
    "errorBoundary",
    'path: screenshotPath',
  ]) {
    assert.ok(suite.includes(signal), "Missing smoke signal: " + signal);
  }
  assert.match(suite, /page\.screenshot\(\{[\s\S]*?fullPage: route\.path === "\/training" \|\| route\.path === "\/workspace\/training"/);
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

test("role smoke runs only in its dedicated CI job, not the broad browser suite", async () => {
  const [suite, workflow] = await Promise.all([
    read("e2e/all-roles-smoke.spec.ts"),
    read(".github/workflows/all-roles-smoke.yml"),
  ]);
  assert.match(suite, /test\.skip\(process\.env\.VAPH_ALL_ROLES_SMOKE !== "true"/);
  assert.match(workflow, /VAPH_ALL_ROLES_SMOKE: "true"/);
  const playwrightConfig = await read("playwright.config.ts");
  assert.match(workflow, /VAPH_ALL_ROLES_PRODUCTION_BUILD: "true"/);
  assert.match(workflow, /Build isolated production-mode app[\s\S]*?run: npm run build/);
  assert.match(playwrightConfig, /VAPH_ALL_ROLES_PRODUCTION_BUILD/);
  assert.match(playwrightConfig, /npm run start -- --hostname 127\.0\.0\.1 --port 3000/);
  assert.match(workflow, /npm run smoke:roles -- --workers=2 --retries=0/);
  assert.match(suite, /home: "\/workspace\/recruiter\/today",[\s\S]*?navigation: \{ from: "\/workspace\/client-success"/);
  assert.match(suite, /navigation: \{ from: "\/workspace\/training", href: "\/workspace\/va", destination: "\/workspace\/va" \}/);
  assert.match(suite, /waitUntil: "domcontentloaded"/);
});

test("desktop and mobile audits reuse four genuine local login sessions instead of exhausting the real rate limiter", async () => {
  const smoke = await read("e2e/all-roles-smoke.spec.ts");
  assert.match(smoke, /roleAuthStates = new Map/);
  assert.match(smoke, /await signIn\(page, account\.email, account\.home\)/);
  assert.match(smoke, /await context\.storageState\(\)/);
  assert.match(smoke, /storageState: savedState/);
  assert.match(smoke, /browser\.newContext\(\{ baseURL: APP_BASE, storageState: state \}\)/);
  assert.match(smoke, /"\/workspace\/admin\/today", "\/workspace\/client-success"/);
  assert.doesNotMatch(smoke, /await signIn\(page, scenario\.email, scenario\.home\)/);
});
