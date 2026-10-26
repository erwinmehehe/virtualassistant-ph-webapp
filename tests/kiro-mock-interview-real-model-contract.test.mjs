import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("real model workflow is manual only, uses reviewed main and independent budget/provider approval", async () => {
  const workflow = await read(".github/workflows/kiro-mock-interview-real-model-acceptance.yml");
  assert.match(workflow, /^on:\n  workflow_dispatch:/m);
  assert.doesNotMatch(workflow, /\n  pull_request:/);
  for (const marker of [
    "github.ref == 'refs/heads/main'",
    "github.repository == 'erwinmehehe/virtualassistant-ph-webapp'",
    "vars.VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT_ALLOWED == 'true'",
    "vars.VAPH_MOCK_INTERVIEW_PROVIDER_POLICY_APPROVED == 'true'",
    "vars.VAPH_AI_GATEWAY_BUDGET_CONFIRMED == 'true'",
    "vars.VAPH_MOCK_INTERVIEW_MODEL_ID != ''",
    "environment: vaph-ai-coach-sandbox",
    "VAPH_MOCK_INTERVIEW_REAL_MODEL_UAT: \"operator-approved\"",
    "AI_MOCK_INTERVIEW_LOCAL_SANDBOX_ONLY: \"true\"",
    "AI_MOCK_INTERVIEW_PROVIDER_APPROVED: \"true\"",
    "AI_MOCK_INTERVIEW_FREE_ONLY: \"true\"",
    "secrets.VAPH_AI_COACH_SANDBOX_GATEWAY_KEY",
    "--workers=1 --retries=0",
    "retention-days: 7",
  ]) assert.ok(workflow.includes(marker), "Missing " + marker);
  assert.match(workflow, /permissions:\n  contents: read/);
  assert.match(workflow, /Refusing a hosted \/ production database/);
  assert.match(workflow, /Run real model against synthetic learner \(maximum three requests\)/);
  assert.ok(
    workflow.indexOf("Validate current free-only model") < workflow.indexOf("secrets.VAPH_AI_COACH_SANDBOX_GATEWAY_KEY"),
    "Provider credentials must be unavailable during initial model/price preflight",
  );
  assert.doesNotMatch(workflow, /AI_MOCK_INTERVIEW_E2E_MOCK: \"true\"|VERCEL_ENV: \"production\"/);
});

test("manual real model test sanitizes actual local course metadata before any provider request", async () => {
  const spec = await read("e2e/kiro-mock-interview-real-model-uat.spec.ts");
  for (const marker of [
    "test.describe.configure({ mode: \"serial\", retries: 0 })",
    "loopback(process.env.NEXT_PUBLIC_SUPABASE_URL)",
    "loopback(process.env.E2E_BASE_URL)",
    "va.e2e@example.test",
    "client.e2e@example.test",
    "admin.from(\"training_courses\").update",
    "admin.from(\"training_lessons\").update",
    "Fictional Virtual Assistant Client Handoff",
    "Fictional handoff practice step ",
    "const answers = [",
    "i < 3",
    "LOCAL TEST INTERVIEW",
    "manual QA",
  ]) assert.ok(spec.toLowerCase().includes(marker.toLowerCase()), "Missing " + marker);
  assert.match(spec, /expect\(anonymous\.status\(\)\)\.toBe\(401\)/);
  assert.match(spec, /expect\(denied\.status\(\)\)\.toBe\(403\)/);
  assert.match(spec, /expect\(res\.status\(\)\)\.toBe\(422\)/);
  assert.match(spec, /expect\(certificates\)\.toHaveLength\(0\)/);
  assert.match(spec, /testOnly\)\.not\.toBe\(true\)/);
  assert.doesNotMatch(spec, /\bhttps:\/\/.+?supabase\.co.*serviceRole/);
});

test("real model eligibility always requires verified preview or protected local operator sandbox", async () => {
  const source = await read("src/lib/kiro-mock-interview-server.ts");
  assert.match(source, /VERCEL_ENV !== \"preview\"/);
  assert.match(source, /VERCEL_GIT_COMMIT_REF !== branch/);
  assert.match(source, /pilotRef === productionRef/);
  assert.match(source, /url\.hostname === pilotRef \+ \"\.supabase\.co\"/);
  assert.match(source, /GITHUB_ACTIONS === \"true\"/);
  assert.match(source, /GITHUB_REF === \"refs\/heads\/main\"/);
  assert.match(source, /GITHUB_REPOSITORY === \"erwinmehehe\/virtualassistant-ph-webapp\"/);
  assert.match(source, /isMockInterviewVerifiedPreview\(\) \|\| isMockInterviewOperatorSandbox\(\)/);
});

test("provider policy remains an explicit human signoff and production AI remains disabled", async () => {
  const [runbook, route] = await Promise.all([
    read("docs/KIRO_MOCK_INTERVIEW_REAL_MODEL_PILOT_20261026.md"),
    read("src/app/api/training/mock-interview/route.ts"),
  ]);
  assert.match(runbook, /Preview is therefore \*\*not approved or configured\*\*/);
  assert.match(runbook, /production Supabase project reference/i);
  assert.match(runbook, /retention, training, deletion and routing terms/i);
  assert.match(runbook, /PRODUCTION APPROVED/);
  assert.match(route, /modelIsFree\(model\)/);
  assert.match(route, /isMockInterviewLivePilot\(session\.userId\)/);
});
