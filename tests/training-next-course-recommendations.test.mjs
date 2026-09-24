import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const recommendationPath = "src/lib/training-recommendations.ts";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const dashboardPath = "src/app/workspace/training/page.tsx";
const componentPath = "src/components/training-next-steps.tsx";
const analyticsRoute = "src/app/api/analytics/route.ts";
const cssPath = "src/app/workspace/training/training-home.css";

test("role-aware recommendation map covers the major learner paths", async () => {
  const source = await readFile(recommendationPath, "utf8");

  assert.match(source, /"seo-virtual-assistant"[\s\S]*"marketing-virtual-assistant"[\s\S]*"social-media-virtual-assistant"/);
  assert.match(source, /"bookkeeping-administration"[\s\S]*"payroll-administration"/);
  assert.match(source, /"medical-healthcare-virtual-assistant"[\s\S]*"cliniko-for-virtual-assistants"/);
  assert.match(source, /"real-estate-virtual-assistant"[\s\S]*"airbnb-short-term-rental-virtual-assistant"/);
  assert.match(source, /"executive-virtual-assistant"[\s\S]*"project-management-for-virtual-assistants"/);
  assert.match(source, /"sales-lead-generation-virtual-assistant"[\s\S]*"customer-support-virtual-assistant"/);
});

test("recommendations skip completed/current courses and avoid Australia-specific courses unless relevant", async () => {
  const source = await readFile(recommendationPath, "utf8");

  assert.match(source, /slug !== args\.currentSlug/);
  assert.match(source, /!course\.completedAt/);
  assert.match(source, /const allowAustralia = Boolean\(australiaPath \|\| current\?\.country_focus === "Australia"\)/);
  assert.match(source, /allowAustralia \|\| course\.country_focus !== "Australia"/);
  assert.match(source, /!allowAustralia && course\.country_focus === "Australia"/);
});

test("Foundations recommendations can follow the learner specialty and Australian specialization", async () => {
  const source = await readFile(recommendationPath, "utf8");

  assert.match(source, /SPECIALTY_PATHS/);
  assert.match(source, /getSpecialtyTrainingPath/);
  assert.match(source, /args\.currentSlug === "virtual-assistant-foundations" && args\.primaryCategory/);
  assert.match(source, /getAustraliaSpecialization\(args\.australiaSpecialization\)/);
  assert.match(source, /priority\.push\(\.\.\.australiaPath\.courses\)/);
});

test("successful final assessment shows ranked next steps after the certificate", async () => {
  const source = await readFile(assessmentPath, "utf8");

  assert.match(source, /getTrainingDashboard/);
  assert.match(source, /passed && course\.completedAt/);
  assert.match(source, /recommendNextTrainingCourses/);
  assert.match(source, /currentSlug: course\.slug/);
  assert.match(source, /TrainingNextSteps/);
  assert.match(source, /sourceCourseTitle=\{course\.title\}/);
});

test("My learning uses the latest completed course as the continuation signal", async () => {
  const source = await readFile(dashboardPath, "utf8");

  assert.match(source, /const latestCompleted = completed\[0\] \|\| null/);
  assert.match(source, /recommendNextTrainingCourses/);
  assert.match(source, /currentSlug: latestCompleted\.slug/);
  assert.match(source, /Next after \{latestCompleted\.title\}/);
  assert.match(source, /!active\.length && latestCompleted && postCompletion\?\.courses\.length/);
  assert.match(source, /TrainingNextSteps/);
});

test("post-completion component emphasizes one best next step and two optional alternatives", async () => {
  const source = await readFile(componentPath, "utf8");

  assert.match(source, /const \[primary, \.\.\.alternates\] = courses/);
  assert.match(source, /Best next step/);
  assert.match(source, /Other useful directions/);
  assert.match(source, /Optional, not a required path/);
  assert.match(source, /training_recommendation_click/);
  assert.match(source, /Recommendations help you choose what to learn next/);
  assert.match(source, /do not affect hiring, recruiter approval, or job access/);
});

test("recommendation clicks are accepted by analytics and the layout is phone-safe", async () => {
  const [route, css] = await Promise.all([
    readFile(analyticsRoute, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(route, /training_recommendation_click/);
  assert.match(css, /\.training-next-primary/);
  assert.match(css, /\.training-next-alternate-grid/);
  assert.match(css, /@media \(max-width: 720px\)/);
  assert.match(css, /grid-template-columns: minmax\(0, 1fr\)/);
});
