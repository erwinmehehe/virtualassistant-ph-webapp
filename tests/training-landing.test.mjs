import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

const page = source("src/app/training/page.tsx");

test("the public training page targets the search term and is indexable", () => {
  assert.match(page, /const META_TITLE = "Free Virtual Assistant Training Philippines \| VA Courses"/);
  assert.match(page, /title: \{ absolute: META_TITLE \}/);
  assert.match(page, /virtual assistant training philippines/i);
  assert.match(page, /canonicalPath\("\/training"\)/);
  // It must be in the sitemap, or nobody finds the one public door.
  assert.match(source("src/lib/public-seo-routes.ts"), /path: "\/training"/);
});

test("the public course library comes from the LMS, not a second static catalogue", () => {
  const publicTraining = source("src/lib/public-training.ts");
  assert.match(page, /getPublicTrainingOverview/);
  assert.doesNotMatch(page, /TRAINING_LEVELS|STATUS_LABEL|training-catalogue/);
  assert.match(publicTraining, /from\("training_courses"\)/);
  assert.match(publicTraining, /from\("training_learning_paths"\)/);
  assert.match(publicTraining, /from\("training_learning_path_courses"\)/);
  assert.match(page, /Global VA training/);
  assert.match(page, /Work with Australian businesses/);
  assert.match(page, /CourseCard course=\{course\}/);
});

test("the landing page only promotes currently published LMS courses", () => {
  assert.match(page, /publishedCourses = courses\.filter\(\(course\) => course\.status === "published"\)/);
  assert.match(page, /Available/);
  assert.match(page, /Recommended first/);
  assert.doesNotMatch(page, /In development/);
  assert.doesNotMatch(page, /courses mapped/);
});

test("the landing page separates new training signup from returning-user login and preserves course intent", () => {
  const intent = source("src/lib/training-intent.ts");
  assert.match(page, /const JOIN_HREF = trainingJoinHref\(\)/);
  assert.match(page, /const LOGIN_HREF = "\/auth\/login\?next=%2Fworkspace%2Ftraining"/);
  assert.match(page, /trainingJoinHref\(course\.slug\)/);
  assert.match(intent, /\/workspace\/training\/courses\/\$\{slug\}/);
  assert.match(intent, /\/auth\/join\/training\?course=/);
  assert.doesNotMatch(page, /workspace%2Fva%2Ftraining/);
});

test("the VA page never leads with the client CTA", () => {
  const footerCta = source("src/components/footer-cta.tsx");
  // /training is excluded from the hire-a-VA band, which addresses buyers.
  assert.ok(footerCta.includes("/training"), "footer CTA should skip /training");
});


test("training social metadata is page-specific and Course schema follows production release state", () => {
  assert.match(page, /\/training\/opengraph-image/);
  assert.match(page, /getPublicTrainingOverview/);
  assert.match(page, /\.\.\.\(foundation \? \[\{/);
  assert.match(page, /"@type": "Course"/);
  const publicTraining = source("src/lib/public-training.ts");
  const trainingAdmin = source("src/app/actions/training-admin.ts");
  assert.match(publicTraining, /getPublicTrainingOverview/);
  assert.match(publicTraining, /status === "published"/);
  assert.match(publicTraining, /revalidate: 300/);
  assert.match(trainingAdmin, /revalidateTag\("public-training"\)/);
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
  assert.match(vaHub, /href="\/training"/);
  assert.match(vaHub, /Start free training|Free VA training/);
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
  assert.match(analyticsRoute, /training_course_interest_click/);
  assert.match(analyticsRoute, /training_email_confirmed/);
  assert.match(analyticsRoute, /training_lesson_complete/);
  assert.match(trainingAuth, /recordProductEvent\("training_account_created"/);
  assert.match(trainingActions, /recordProductEvent\("training_course_start"/);
  assert.match(trainingActions, /recordProductEvent\("training_lesson_complete"/);
  assert.match(trainingActions, /recordProductEvent\("training_course_complete"/);
  assert.match(adminAnalytics, /Training engagement/);
});


test("the public training page keeps individual course pages private", () => {
  assert.doesNotMatch(page, /href=\{?`?\/training\/courses/);
  assert.doesNotMatch(page, /workspace\/training\/courses/);
  assert.match(page, /Lessons stay inside your free training account/);
  assert.match(page, /single public training-page strategy|one public training page/i);
});

test("training landing copy does not treat learning as a hiring gate", () => {
  assert.match(page, /completely separate from hiring/);
  assert.match(page, /does not automatically create a candidate profile/);
  assert.match(page, /Training is never a recruitment gate/);
  assert.match(page, /not employment history, professional experience, or hiring eligibility/i);
  assert.doesNotMatch(page, /get you picked by clients|client-ready proof|guaranteed placement/i);
});
