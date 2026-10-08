import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("invalid proposal recovery has a boundary beside the dynamic token route", async () => {
  const [boundary, route, smoke] = await Promise.all([
    source("src/app/proposal/[token]/not-found.tsx"),
    source("src/app/proposal/[token]/page.tsx"),
    source("scripts/production-browser-smoke.mjs"),
  ]);
  assert.match(boundary, /from "\.\.\/not-found"/);
  assert.match(route, /if \(!proposal\) notFound\(\)/);
  assert.match(smoke, /expectedHeading: "We couldn’t find this hiring proposal\."/);
  assert.match(smoke, /waitFor\(\{ state: "visible", timeout: 20000 \}\)/);
  assert.match(smoke, /-failed\.html/);
  assert.match(smoke, /Contact the recruiting team/);
});

test("training checkpoint failure does not crash a learner's lesson", async () => {
  const sourceText = await source("src/components/training-lesson-integrity-gate.tsx");
  assert.match(sourceText, /try \{\s*const result = await checkTrainingLessonCheckpointAction/);
  assert.match(sourceText, /catch \{\s*\/\/ An old open tab/);
  assert.match(sourceText, /We couldn't save that answer/);
  assert.match(sourceText, /window\.location\.reload\(\)/);
});

test("training workspace provides a full reload for stale bundles and uncertain submissions", async () => {
  const [boundary, shared] = await Promise.all([
    source("src/app/workspace/training/error.tsx"),
    source("src/components/workspace-error.tsx"),
  ]);
  assert.match(boundary, /<WorkspaceError error=\{error\} reset=\{reset\} home="\/workspace\/training"/);
  assert.match(shared, /window\.location\.reload\(\)/);
  assert.match(shared, /your changes may already have saved/);
});

test("VA setup and profile never render blank editable forms after failed reads", async () => {
  const [onboarding, profile] = await Promise.all([
    source("src/app/workspace/va/onboarding/page.tsx"),
    source("src/app/workspace/va/profile/page.tsx"),
  ]);
  assert.match(onboarding, /data: va, error: profileError/);
  assert.match(onboarding, /if \(profileError\)/);
  assert.match(onboarding, /Reload setup/);
  assert.match(profile, /data: va, error: profileError/);
  assert.match(profile, /if \(profileError\)/);
  assert.match(profile, /Reload profile/);
});

test("noncritical training credentials no longer block workspace first paint", async () => {
  const [dashboard, profile] = await Promise.all([
    source("src/app/workspace/va/page.tsx"),
    source("src/app/workspace/va/profile/page.tsx"),
  ]);
  assert.match(dashboard, /async function VaDashboardCredentials/);
  assert.match(dashboard, /Suspense fallback=\{null\}/);
  assert.match(dashboard, /await getVaDashboardSummary\(userId\)/);
  assert.doesNotMatch(dashboard, /await Promise\.all\(\[getVaDashboardSummary\(userId\),getTrainingCredentialsForUser\(userId\)\]\)/);
  assert.match(profile, /async function VaProfileCredentials/);
  assert.match(profile, /<Suspense fallback=\{null\}>/);
});

test("recruiter data fetches run in parallel and the funnel names the proposal gap", async () => {
  const [today, funnel] = await Promise.all([
    source("src/app/workspace/recruiter/today/page.tsx"),
    source("src/components/agency-funnel-dashboard.tsx"),
  ]);
  assert.match(today, /const \[\{ data: summaryData, error: summaryError \}, roleSummary\] = await Promise\.all/);
  assert.match(today, /getRecruiterRolesSummary\(userId\)/);
  assert.match(funnel, /journey\.qualified > 0 && proposal\.sent === 0/);
  assert.match(funnel, /no recorded proposal sends/);
  assert.match(funnel, /Open client leads and proposal follow-ups/);
});
