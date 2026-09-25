import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const trainingPage = "src/app/training/page.tsx";
const headerPath = "src/components/training-site-header.tsx";
const siteNavPath = "src/components/site-nav.tsx";
const joinPage = "src/app/auth/join/training/page.tsx";
const joinForm = "src/components/training-join-form.tsx";
const joinAction = "src/app/actions/training-auth.ts";
const intentPath = "src/lib/training-intent.ts";
const analyticsPath = "src/components/analytics.tsx";
const analyticsRoute = "src/app/api/analytics/route.ts";
const confirmRoute = "src/app/auth/confirm/route.ts";
const callbackRoute = "src/app/auth/callback/route.ts";
const migrationPath = "supabase/migrations/20260924162000_training_analytics_auth_user_fk.sql";
const cssPath = "src/app/training-landing.css";

test("training public header stays learner-focused and removes the buyer CTA", async () => {
  const [page, header, siteNav] = await Promise.all([
    readFile(trainingPage, "utf8"),
    readFile(headerPath, "utf8"),
    readFile(siteNavPath, "utf8"),
  ]);

  assert.match(page, /TrainingSiteHeader/);
  assert.match(header, /SiteNav/);
  assert.match(header, /mode="training"/);
  assert.match(siteNav, /Start free training/);
  assert.match(siteNav, /Training login/);
  assert.match(siteNav, /Training home/);
  assert.match(siteNav, /Courses/);
  assert.match(siteNav, /How it works/);
  assert.match(siteNav, /Certificates/);
  assert.match(siteNav, /FAQ/);
  assert.match(siteNav, /For Virtual Assistants/);
  assert.match(siteNav, /VA guides/);
  assert.doesNotMatch(siteNav, />VA jobs<\/Link>/);
  assert.doesNotMatch(siteNav, />Browse VA jobs<\/Link>/);
  const trainingNav = siteNav.slice(siteNav.indexOf("function TrainingNav"), siteNav.indexOf("export function SiteNav"));
  assert.doesNotMatch(trainingNav, /Hire a Virtual Assistant/);
  assert.doesNotMatch(trainingNav, /href="\/hire"/);
});

test("course cards and Foundations preserve the selected course through signup", async () => {
  const [page, intent, join] = await Promise.all([
    readFile(trainingPage, "utf8"),
    readFile(intentPath, "utf8"),
    readFile(joinPage, "utf8"),
  ]);

  assert.match(page, /trainingJoinHref\(course\.slug\)/);
  assert.match(page, /data-course-slug=\{course\.slug\}/);
  assert.match(page, /training_course_interest_click/);
  assert.match(page, /Start Foundations free/);
  assert.match(intent, /\/auth\/join\/training\?course=/);
  assert.match(intent, /\/workspace\/training\/courses\/\$\{slug\}/);
  assert.match(join, /safeTrainingCourseSlug/);
  assert.match(join, /item\.status === "published"/);
  assert.match(join, /TrainingJoinForm course=\{course\}/);
});

test("course library is compact by default while keeping every published course accessible", async () => {
  const page = await readFile(trainingPage, "utf8");

  assert.match(page, /globalCourses\.slice\(0, 6\)/);
  assert.match(page, /globalCourses\.slice\(6\)/);
  assert.match(page, /australiaCourses\.slice\(0, 6\)/);
  assert.match(page, /australiaCourses\.slice\(6\)/);
  assert.match(page, /View all \{globalCourseCount\} global courses/);
  assert.match(page, /View all \{australiaCourseCount\} Australia courses/);
  assert.match(page, /tr-course-more/);
});

test("training signup uses inline state and preserves entered values on recoverable errors", async () => {
  const [form, action] = await Promise.all([
    readFile(joinForm, "utf8"),
    readFile(joinAction, "utf8"),
  ]);

  assert.match(form, /useActionState\(joinTrainingAction/);
  assert.match(form, /value=\{fullName\}/);
  assert.match(form, /value=\{email\}/);
  assert.match(form, /value=\{password\}/);
  assert.match(form, /training-password-toggle/);
  assert.match(form, /training-password-checks/);
  assert.match(form, /state\.fieldErrors/);
  assert.match(form, /TurnstileWidget key=\{state\.attempt\}/);

  assert.match(action, /Promise<TrainingJoinState>/);
  assert.match(action, /status: "error"/);
  assert.match(action, /training_signup_error/);
  assert.doesNotMatch(action, /function joinError\(message: string\): never/);
  assert.doesNotMatch(action, /redirect\(\`\/auth\/join\/training\?error=/);
});

test("successful signup shows a dedicated confirmation state and keeps the intended course", async () => {
  const [form, action] = await Promise.all([
    readFile(joinForm, "utf8"),
    readFile(joinAction, "utf8"),
  ]);

  assert.match(form, /Check your email/);
  assert.match(form, /I already confirmed/);
  assert.match(form, /Resend confirmation email/);
  assert.match(form, /Open \$\{state\.courseTitle\}/);
  assert.match(action, /intended_training_course/);
  assert.match(action, /const next = trainingCourseDestination\(courseSlug\)/);
  assert.match(action, /next,/);
  assert.match(action, /status: "success"/);
  assert.match(action, /courseTitle,/);
});

test("training acquisition analytics support training-only auth users and confirmation milestones", async () => {
  const [analytics, route, action, confirm, callback, migration] = await Promise.all([
    readFile(analyticsPath, "utf8"),
    readFile(analyticsRoute, "utf8"),
    readFile(joinAction, "utf8"),
    readFile(confirmRoute, "utf8"),
    readFile(callbackRoute, "utf8"),
    readFile(migrationPath, "utf8"),
  ]);

  assert.match(analytics, /course_slug: clicked\.dataset\.courseSlug/);
  assert.match(analytics, /cta_position: clicked\.dataset\.ctaPosition/);
  assert.match(route, /training_course_interest_click/);
  assert.match(route, /training_signup_submit_click/);
  assert.match(route, /training_account_created/);
  assert.match(route, /training_confirmation_sent/);
  assert.match(route, /training_email_confirmed/);
  assert.match(action, /recordProductEvent\("training_account_created"/);
  assert.match(action, /recordProductEvent\("training_confirmation_sent"/);
  assert.match(confirm, /recordProductEvent\("training_email_confirmed"/);
  assert.match(callback, /recordProductEvent\("training_email_confirmed"/);
  assert.match(migration, /references auth\.users\(id\)/i);
  assert.match(migration, /on delete set null/i);
});

test("mobile training CTA only appears after the hero and before the final CTA", async () => {
  const [page, mobile, css] = await Promise.all([
    readFile(trainingPage, "utf8"),
    readFile("src/components/training-mobile-cta.tsx", "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /data-training-hero/);
  assert.match(page, /data-training-final-cta/);
  assert.match(page, /TrainingMobileCta/);
  assert.match(mobile, /heroRect\.bottom < 0/);
  assert.match(mobile, /finalRect\.top < window\.innerHeight/);
  assert.match(mobile, /mobile_sticky/);
  assert.match(css, /\.tr-mobile-cta\.is-visible/);
  assert.match(css, /@media \(max-width: 640px\)/);
});
