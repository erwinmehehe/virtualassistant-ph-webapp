import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (file) => readFile(new URL("../" + file, import.meta.url), "utf8");

test("offline coach fixture cannot activate on a production Next.js runtime", async () => {
  const api = await read("src/app/api/training/coach/route.ts");
  assert.match(api, /NODE_ENV !== "development"/);
  assert.match(api, /AI_TRAINING_COACH_E2E_MOCK !== "true"/);
  assert.match(api, /NEXT_PUBLIC_SUPABASE_URL/);
  assert.match(api, /url\.protocol === "http:"/);
  assert.match(api, /"127\.0\.0\.1"/);
  assert.ok(api.indexOf("if (allowLocalCoachFixture())") > api.indexOf('enforceActionRateLimit("training-ai-coach"'));
  assert.match(api, /LOCAL TEST COACH - not a live AI response/);
});

test("pilot covers access, chat modes, mobile, refusal, and rate limits", async () => {
  const source = await read("e2e/training-ai-coach-pilot.spec.ts");
  for (const item of [
    "anonymous requests are blocked",
    "not enrolled in Foundations is denied",
    "enrolled VA sees explain, practice, and review",
    "cannot forge a course",
    "graded answer requests are refused",
    "20 per 24-hour atomic quota",
    "coach-desktop.png",
    "coach-mobile.png",
  ]) assert.ok(source.includes(item), "Missing " + item);
  assert.match(source, /!isLocal\(databaseURL\) \|\| !isLocal\(appURL\)/);
  assert.match(source, /test\.skip\(process\.env\.AI_TRAINING_COACH_E2E_MOCK !== "true"/);
});

test("pilot workflow uses isolated DB without AI or deployment credentials", async () => {
  const yaml = await read(".github/workflows/training-coach-pilot.yml");
  const pkg = JSON.parse(await read("package.json"));
  assert.match(yaml, /AI_TRAINING_COACH_E2E_MOCK: "true"/);
  assert.match(yaml, /AI_TRAINING_COACH_ENABLED: "true"/);
  assert.match(yaml, /Refusing nonlocal Supabase/);
  assert.match(yaml, /Upload coach screenshots[\s\S]*?if: always\(\)/);
  assert.match(yaml, /path: artifacts\/training-coach-pilot\//);
  assert.equal(pkg.scripts["smoke:coach"], "playwright test e2e/training-ai-coach-pilot.spec.ts --project=chromium --workers=1");
  assert.ok(!yaml.includes("AI_GATEWAY_API_KEY") && !yaml.includes("VERCEL_TOKEN"));
});

test("real API still fails closed and cannot create certificates or grades", async () => {
  const api = await read("src/app/api/training/coach/route.ts");
  assert.match(api, /AI_TRAINING_COACH_ENABLED !== "true"/);
  assert.match(api, /!course\.enrolled/);
  assert.match(api, /trainingCoachRequestsExamAnswers/);
  assert.doesNotMatch(api, /training_certificates|finalizeTrainingCourseIfEligible|training_assessment_submissions/);
});
