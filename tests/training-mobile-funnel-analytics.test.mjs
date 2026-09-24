import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const analyticsPath = "src/components/analytics.tsx";
const analyticsApiPath = "src/app/api/analytics/route.ts";
const adminActionsPath = "src/app/actions/training-admin.ts";
const trainingLibPath = "src/lib/training.ts";
const adminTrainingPath = "src/app/workspace/admin/training/page.tsx";
const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const certificateActionsPath = "src/components/training-certificate-actions.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("training route analytics distinguish course, lesson, assessment, and certificate views", async () => {
  const [analytics, api] = await Promise.all([
    readFile(analyticsPath, "utf8"),
    readFile(analyticsApiPath, "utf8"),
  ]);

  assert.match(analytics, /training_dashboard_view/);
  assert.match(analytics, /training_course_view/);
  assert.match(analytics, /training_lesson_view/);
  assert.match(analytics, /training_assessment_view/);
  assert.match(analytics, /training_certificate_view/);
  assert.match(analytics, /course_slug: courseSlug/);
  assert.match(analytics, /assessment_id:/);
  assert.match(analytics, /lesson_id:/);

  for (const event of [
    "training_assessment_view",
    "training_certificate_view",
    "training_certificate_open",
    "training_certificate_share",
  ]) {
    assert.ok(api.includes(`"${event}"`), "Analytics API must allow " + event);
  }
});

test("assessment review closes the learner funnel through completion and certificate issuance", async () => {
  const actions = await readFile(adminActionsPath, "utf8");

  assert.match(actions, /event_name: "training_assessment_reviewed"/);
  assert.match(actions, /outcome: decision/);
  assert.match(actions, /course_slug: reviewedCourse\?\.slug \|\| null/);
  assert.match(actions, /event_name: "training_course_complete"/);
  assert.match(actions, /event_name: "training_certificate_issued"/);
  assert.match(actions, /completion\.certificateIssued/);
});

test("admin training exposes a 30-day milestone funnel without presenting it as a fixed cohort", async () => {
  const [lib, page] = await Promise.all([
    readFile(trainingLibPath, "utf8"),
    readFile(adminTrainingPath, "utf8"),
  ]);

  for (const event of [
    "training_course_start",
    "training_lesson_complete",
    "training_assessment_submit",
    "training_assessment_reviewed",
    "training_course_complete",
    "training_certificate_view",
  ]) {
    assert.ok(lib.includes(`event: "${event}"`), "Missing funnel stage " + event);
  }

  assert.match(lib, /funnelWindowDays = 30/);
  assert.match(lib, /new Set\(matching\.map/);
  assert.match(page, /Learner completion funnel/);
  assert.match(page, /activity funnel, not a fixed start-date cohort/);
  assert.match(page, /stage\.learners/);
  assert.match(page, /stage\.events/);
});

test("primary learner CTAs emit the funnel interactions", async () => {
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

test("375px and 390px learner flow protects long titles, forms, resources, and completion actions", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /Final learner-flow phone QA: 375px and 390px/);
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /overflow-wrap: anywhere/);
  assert.match(css, /training-assessment-resource/);
  assert.match(css, /training-assessment-submit textarea/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /training-player-footer-nav \.btn/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /training-completion-credential code/);
  assert.match(css, /training-certificate-actions \.btn/);
});
