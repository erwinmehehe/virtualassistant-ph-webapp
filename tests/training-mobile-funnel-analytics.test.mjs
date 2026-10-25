import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyticsPath = "src/components/analytics.tsx";
const analyticsApiPath = "src/app/api/analytics/route.ts";
const trainingActionsPath = "src/app/actions/training.ts";
const trainingLibPath = "src/lib/training.ts";
const adminTrainingPath = "src/app/workspace/admin/training/page.tsx";
const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const certificateActionsPath = "src/components/training-certificate-actions.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("training and candidate analytics are inert while learner state persists", async () => {
  const [client, api, recorder] = await Promise.all([
    readFile(analyticsPath, "utf8"),
    readFile(analyticsApiPath, "utf8"),
    readFile("src/lib/product-events.ts", "utf8"),
  ]);
  assert.match(client, /return null/);
  assert.match(api, /status: 204/);
  assert.doesNotMatch(recorder, /analytics_events|createAdminClient/);
  assert.match(recorder, /export async function recordProductEvent/);
});

test("automatic assessment scoring closes the learner funnel through certificate issuance", async () => {
  const actions = await readFile(trainingActionsPath, "utf8");

  assert.match(actions, /recordProductEvent\("training_assessment_reviewed"/);
  assert.match(actions, /outcome: passed \? "pass" : "needs_revision"/);
  assert.match(actions, /source: "automatic"/);
  assert.match(actions, /recordProductEvent\("training_course_complete"/);
  assert.match(actions, /recordProductEvent\("training_certificate_issued"/);
  assert.match(actions, /completion\.certificateIssued/);
});

test("admin training shows saved progress, not the retired event-based funnel", async () => {
  const [lib, page] = await Promise.all([
    readFile(trainingLibPath, "utf8"),
    readFile(adminTrainingPath, "utf8"),
  ]);
  assert.doesNotMatch(lib, /\.from\("analytics_events"\)/);
  assert.doesNotMatch(lib, /funnelDefinitions|funnelWindowDays/);
  assert.match(lib, /buildTrainingCohortConversion/);
  assert.match(lib, /buildTrainingCompletionHealth/);
  assert.match(page, /Completion within 7 and 14 days/);
  assert.match(page, /Learner integrity signals/);
  assert.doesNotMatch(page, /Learner completion funnel|stage\.events|Checkpoint failure/);
});

test("primary learner CTAs remain accessible while telemetry is disabled", async () => {
  const [course, lesson, assessment, certificateActions] = await Promise.all([
    readFile(coursePath, "utf8"),
    readFile(lessonPath, "utf8"),
    readFile(assessmentPath, "utf8"),
    readFile(certificateActionsPath, "utf8"),
  ]);

  assert.match(course, /data-track="training_course_continue"/);
  assert.match(course, /data-track="training_assessment_open"/);
  assert.match(course, /data-track="training_certificate_open"/);
  assert.match(lesson, /training_course_continue/);
  assert.match(lesson, /training_assessment_open/);
  assert.match(lesson, /training_certificate_open/);
  assert.match(assessment, /data-track="training_certificate_open"/);
  assert.match(certificateActions, /data-track="training_certificate_share"/);
});

test("375px and 390px learner flow protects integrity controls and automatic assessment actions", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /Final learner-flow phone QA: 375px and 390px/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /training-integrity-gate/);
  assert.match(css, /training-auto-question/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /training-completion-credential code/);
  assert.match(css, /training-certificate-actions \.btn/);
});
