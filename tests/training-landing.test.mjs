import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const page = source("src/app/training/page.tsx");
const catalogue = source("src/lib/training-catalogue.ts");

test("the public training page targets the search term and is indexable", () => {
  assert.match(page, /const META_TITLE = "Virtual Assistant Training Philippines \| Free VA Course"/);
  assert.match(page, /title: \{ absolute: META_TITLE \}/);
  assert.match(page, /virtual assistant training philippines/i);
  assert.match(page, /canonicalPath\("\/training"\)/);
  // It must be in the sitemap, or nobody finds the one public door.
  assert.match(source("src/lib/public-seo-routes.ts"), /path: "\/training"/);
});

test("the catalogue is derived from what we already sell, not invented", () => {
  assert.match(catalogue, /softwarePages\.map/);
  assert.match(catalogue, /href: `\/software\/\$\{page\.slug\}`/);
  assert.match(catalogue, /href: `\/industries\/\$\{industry\.slug\}`/);
});

test("only courses that exist are offered as available", () => {
  assert.match(page, /STATUS_LABEL\[course\.status\]/);
  assert.match(catalogue, /planned: "Planned"/);
});

test("the landing page separates new training signup from returning-user login", () => {
  // New learners should not be dumped on a login screen. The dedicated training
  // account flow keeps learning separate from candidate onboarding.
  assert.match(page, /const JOIN_HREF = "\/auth\/join\/training"/);
  assert.match(page, /const LOGIN_HREF = "\/auth\/login\?next=%2Fworkspace%2Ftraining"/);
  assert.doesNotMatch(page, /workspace%2Fva%2Ftraining/);
});

test("the VA page never leads with the client CTA", () => {
  const footerCta = source("src/components/footer-cta.tsx");
  // /training is excluded from the hire-a-VA band, which addresses buyers.
  assert.ok(footerCta.includes("/training"), "footer CTA should skip /training");
});


test("training social metadata is page-specific and course schema stays gated", () => {
  assert.match(page, /\/training\/opengraph-image/);
  assert.match(page, /const openCourses = .*status === "open"/);
  assert.match(page, /"@type": "Course"/);
  const og = source("src/app/training/opengraph-image.tsx");
  assert.match(og, /Learn the work\./);
  assert.match(og, /Show what you can do\./);
});

test("candidate education pages route readers into training instead of buyer CTAs", () => {
  const article = source("src/components/blog-article.tsx");
  const vaHub = source("src/app/for-virtual-assistants/page.tsx");
  assert.match(article, /CANDIDATE_LEARNING_GUIDES/);
  assert.match(article, /href="\/training" data-track="blog_training_click"/);
  assert.match(article, /Browse VA jobs/);
  assert.match(vaHub, /href="\/training">Free VA training/);
});

test("the training funnel records successful product actions", () => {
  const browserAnalytics = source("src/components/analytics.tsx");
  const analyticsRoute = source("src/app/api/analytics/route.ts");
  const trainingActions = source("src/app/actions/training.ts");
  const trainingAuth = source("src/app/actions/training-auth.ts");
  const adminAnalytics = source("src/app/workspace/admin/analytics/page.tsx");

  assert.match(browserAnalytics, /training_landing_view/);
  assert.match(browserAnalytics, /training_dashboard_view/);
  assert.match(analyticsRoute, /training_account_click/);
  assert.match(analyticsRoute, /training_lesson_complete/);
  assert.match(trainingAuth, /recordProductEvent\("training_account_created"/);
  assert.match(trainingActions, /recordProductEvent\("training_course_start"/);
  assert.match(trainingActions, /recordProductEvent\("training_lesson_complete"/);
  assert.match(trainingActions, /recordProductEvent\("training_course_complete"/);
  assert.match(adminAnalytics, /Training engagement/);
});
