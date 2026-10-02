import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const helperPath = "src/lib/training-credentials.ts";
const componentPath = "src/components/training-credentials.tsx";
const talentPath = "src/app/find-talent/page.tsx";
const dashboardCssPath = "src/app/dashboard-premium.css";
const publicCssPath = "src/app/cro-hiring-tools.css";

test("completed learning paths are derived only when every course has a verified credential", async () => {
  const helper = await readFile(helperPath, "utf8");

  assert.match(helper, /AUSTRALIA_SPECIALIZATIONS/);
  assert.match(helper, /completedTrainingSpecializations/);
  assert.match(helper, /supporting\.length !== specialization\.courses\.length/);
  assert.match(helper, /courseCount: specialization\.courses\.length/);
  assert.match(helper, /completedAt: issuedAt/);
});

test("VA and recruiter training evidence show completed paths separately from course certificates", async () => {
  const component = await readFile(componentPath, "utf8");

  assert.match(component, /completedTrainingSpecializations\(credentials\)/);
  assert.match(component, /Completed learning paths/);
  assert.match(component, /Calculated from verified course completions/);
  assert.match(component, /verified courses/);
  assert.match(component, /Learning-path completion confirms the listed training sequence only/);
  assert.match(component, /does not verify employment history, client experience, or role suitability/);
  assert.match(component, /\/workspace\/training\/paths\//);
});

test("public talent cards only derive completed paths from certificates already opted into public display", async () => {
  const page = await readFile(talentPath, "utf8");

  assert.match(page, /getTrainingCredentialsForUsers/);
  assert.match(page, /\{ publicOnly: true \}/);
  assert.match(page, /completedTrainingSpecializations\(allPublicTraining\)/);
  assert.match(page, /Completed learning path/);
  assert.match(page, /Based only on training certificates this candidate chose to show publicly/);
});

test("specialization evidence has compact profile and public-card styling", async () => {
  const [dashboardCss, publicCss] = await Promise.all([
    readFile(dashboardCssPath, "utf8"),
    readFile(publicCssPath, "utf8"),
  ]);

  assert.match(dashboardCss, /\/\* Training specialization evidence \*\//);
  assert.match(dashboardCss, /\.training-specialization-evidence-item/);
  assert.match(dashboardCss, /@media \(max-width: 620px\)[\s\S]*\.training-specialization-evidence-item/);

  assert.match(publicCss, /\.talent-path-preview/);
  assert.match(publicCss, /\.talent-path-preview-label/);
});
