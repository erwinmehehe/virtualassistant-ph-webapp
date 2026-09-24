import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923040500_free_training_foundation.sql";

test("training is independent from VA candidate profiles", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /references auth\.users\(id\)/i);
  assert.doesNotMatch(sql, /references public\.va_profiles/i);

  const auth = await readFile("src/lib/auth.ts", "utf8");
  assert.match(auth, /requireAuthenticatedUserFast/);
  assert.doesNotMatch(
    auth.match(/export async function requireAuthenticatedUserFast[\s\S]*?\n}\n/)?.[0] || "",
    /requireRoleFast\("va"\)/,
  );
});

test("private training routes are noindex", async () => {
  const layout = await readFile("src/app/workspace/training/layout.tsx", "utf8");
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
  assert.match(layout, /requireAuthenticatedUserFast/);
});

test("lesson design supports detailed lessons up to thirty minutes", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /estimated_minutes between 1 and 30/i);
  assert.match(sql, /content_version/i);
  assert.match(sql, /last_reviewed_at/i);
  assert.match(sql, /trademark_disclaimer/i);
});

test("training tables use RLS and learner-owned progress", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const table of [
    "training_courses",
    "training_modules",
    "training_lessons",
    "training_enrollments",
    "training_lesson_progress",
    "training_assessments",
    "training_assessment_submissions",
    "training_certificates",
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`, "i"));
  }
  assert.match(sql, /learners read own lesson progress/i);
  assert.match(sql, /\(select auth\.uid\(\)\) = user_id/i);
  assert.doesNotMatch(sql, /grant\s+select[^;]*\s+to\s+anon/i);
});

test("training actions do not change hiring or vetting state", async () => {
  const action = await readFile("src/app/actions/training.ts", "utf8");
  assert.doesNotMatch(action, /va_vetting|applications|job_shortlist|directory_visible|work_readiness/i);
  assert.match(action, /training_enrollments/);
  assert.match(action, /training_lesson_progress/);
});

test("VA and admin workspaces expose the training system", async () => {
  const nav = await readFile("src/components/app-nav-links.tsx", "utf8");
  assert.match(nav, /\["Training", "\/workspace\/training", GraduationCap\]/);
  assert.match(nav, /\["Training", "\/workspace\/admin\/training", GraduationCap\]/);
});


test("training-only signup never creates candidate or hiring records", async () => {
  const action = await readFile("src/app/actions/training-auth.ts", "utf8");
  assert.match(action, /account_type:\s*"training"/);
  assert.match(action, /next:\s*"\/workspace\/training"/);
  assert.doesNotMatch(action, /va_profiles|va_vetting|client_profiles|applications|directory_visible/i);

  const page = await readFile("src/app/auth/join/training/page.tsx", "utf8");
  assert.match(page, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/);
});

test("shared auth explicitly permits the training workspace without role coercion", async () => {
  const authAction = await readFile("src/app/actions/auth.ts", "utf8");
  const callback = await readFile("src/app/auth/callback/route.ts", "utf8");
  const confirm = await readFile("src/app/auth/confirm/route.ts", "utf8");
  for (const source of [authAction, callback, confirm]) {
    assert.match(source, /isTrainingPath/);
    assert.match(source, /\/workspace\/training/);
  }
});

test("lesson completion is scoped to its course and certificate issuance is server-verified", async () => {
  const action = await readFile("src/app/actions/training.ts", "utf8");
  const completion = await readFile("src/lib/training-completion.ts", "utf8");
  assert.match(action, /\.eq\("slug", courseSlug\)/);
  assert.match(action, /\.in\("module_id", moduleIds\)/);
  assert.match(action, /finalizeTrainingCourseIfEligible/);
  assert.match(completion, /training_assessment_submissions/);
  assert.match(completion, /status", "reviewed"/);
  assert.match(completion, /certificate_of_completion/);
});

test("training shell includes a mobile navigation", async () => {
  const shell = await readFile("src/components/training-shell.tsx", "utf8");
  assert.match(shell, /app-nav-mobile/);
  assert.match(shell, /Mobile training navigation/);
});


test("auth trigger preserves training-only accounts outside the VA candidate system", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /create or replace function public\.handle_new_user/i);
  assert.match(sql, /raw_user_meta_data->>'account_type'\s*=\s*'training'/i);
  assert.match(sql, /return new;/i);

  const form = await readFile("src/components/training-join-form.tsx", "utf8");
  assert.doesNotMatch(form, /oauthAction|Continue with Google|Continue with Microsoft/);
});


test("training-directed login does not expose first-time social signup", async () => {
  const login = await readFile("src/app/auth/login/page.tsx", "utf8");
  assert.match(login, /socialEnabled\s*=\s*\(googleEnabled \|\| microsoftEnabled\) && !trainingLogin/);
});


test("admin training authoring stays admin-only and guarded before publish", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /requireRoleFast\("admin"\)/);
  assert.match(action, /Record a reviewer and review date before publishing the course/);
  assert.match(action, /Every published lesson needs substantive content/);
  assert.match(action, /Record a reviewer and review date before publishing this lesson/);
  assert.match(action, /createTrainingAssessmentAction/);
  assert.match(action, /updateTrainingAssessmentAction/);
});

test("Virtual Assistant Foundations has a reviewed release migration", async () => {
  const seed = await readFile("supabase/migrations/20260923040600_seed_va_foundations_training.sql", "utf8");
  const release = await readFile("supabase/migrations/20260923061000_release_va_foundations.sql", "utf8");

  const lessonIds = new Set(seed.match(/12000000-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(lessonIds.size, 13);

  assert.match(release, /estimated_minutes = 240/);
  assert.match(release, /content_version = 2/);
  assert.match(release, /VirtualAssistant\.com\.ph Editorial Team/);
  assert.match(release, /Pass score: 80%/);
  assert.match(release, /pass_score = 80/);
  assert.match(release, /status = 'published'/);
  assert.match(release, /where slug = 'responsible-ai-for-va-work'/);
  assert.match(release, /where slug = 'time-zones-deadlines-and-handoffs'/);
});

test("training authoring UI edits course, lesson blocks, and assessments without public course pages", async () => {
  const courseEditor = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const lessonEditor = await readFile("src/app/workspace/admin/training/[courseId]/lessons/[lessonId]/page.tsx", "utf8");
  assert.match(courseEditor, /Course settings/);
  assert.match(courseEditor, /Publish course/);
  assert.match(courseEditor, /Add assessment/);
  assert.match(lessonEditor, /Add content block/);
  assert.match(lessonEditor, /Practice scenario/);
  assert.match(lessonEditor, /Maximum 30 minutes|30 minutes or less/);
});


test("editing training content invalidates stale review and publication state", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /function invalidateCourseReview/);
  assert.match(action, /status:\s*"draft"/);
  assert.match(action, /published_at:\s*null/);
  assert.match(action, /function invalidateLessonReview/);
  assert.match(action, /is_published:\s*false/);
  assert.match(action, /last_reviewed_at:\s*null/);

  const courseEditor = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  const lessonEditor = await readFile("src/app/workspace/admin/training/[courseId]/lessons/[lessonId]/page.tsx", "utf8");
  assert.match(courseEditor, /name="review_action"/);
  assert.match(lessonEditor, /name="review_action"/);
});


test("training roadmap seeds fifteen total courses in a fixed global order", async () => {
  const seed = await readFile("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql", "utf8");
  assert.match(seed, /add column if not exists recommended_order smallint/i);
  assert.match(seed, /virtual-assistant-foundations/);
  assert.match(seed, /recommended_order = 1/);

  const courseInserts = seed.match(/insert into public\.training_courses/g) || [];
  const moduleInserts = seed.match(/insert into public\.training_modules/g) || [];
  const lessonInserts = seed.match(/insert into public\.training_lessons/g) || [];
  const assessmentInserts = seed.match(/insert into public\.training_assessments/g) || [];
  assert.equal(courseInserts.length, 14);
  assert.equal(moduleInserts.length, 84);
  assert.equal(lessonInserts.length, 168);
  assert.equal(assessmentInserts.length, 14);

  for (const title of [
    "Real Estate Virtual Assistant",
    "Medical / Healthcare Virtual Assistant",
    "Executive Virtual Assistant",
    "Marketing Virtual Assistant",
    "Bookkeeping Administration for Virtual Assistants",
    "Sales & Lead Generation Virtual Assistant",
    "E-commerce Virtual Assistant",
    "Social Media Virtual Assistant",
    "Customer Support Virtual Assistant",
    "SEO Virtual Assistant",
    "Operations Virtual Assistant",
    "Project Management for Virtual Assistants",
    "Payroll Administration for Virtual Assistants",
    "Airbnb / Short-Term Rental Virtual Assistant",
  ]) {
    assert.ok(seed.includes(title), "Missing course: " + title);
  }
});

test("new roadmap courses remain invisible until full content review", async () => {
  const seed = await readFile("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql", "utf8");
  assert.match(seed, /'draft'/);
  assert.match(seed, /'\[\]'::jsonb, 25/);
  assert.match(seed, /false, 1, now\(\), now\(\)/);

  const training = await readFile("src/lib/training.ts", "utf8");
  assert.match(training, /\.eq\("status", "published"\)/);
  assert.match(training, /\.eq\("is_published", true\)/);

  const authoring = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(authoring, /recommended_order/);
  assert.match(authoring, /Record a reviewer and review date before publishing the course/);
});

test("training library and admin inventory use roadmap order", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");
  assert.match(training, /recommended_order: number \| null/);
  assert.match(training, /\.order\("recommended_order", \{ ascending: true \}\)/);

  const admin = await readFile("src/app/workspace/admin/training/page.tsx", "utf8");
  assert.match(admin, /course\.recommended_order/);
  assert.match(admin, /global curriculum/);
});


test("learners can submit practical assessments and admins can review them", async () => {
  const learnerAction = await readFile("src/app/actions/training.ts", "utf8");
  const learnerPage = await readFile("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx", "utf8");
  const adminAction = await readFile("src/app/actions/training-admin.ts", "utf8");
  const adminPage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");

  assert.match(learnerAction, /submitTrainingAssessmentAction/);
  assert.match(learnerAction, /training_assessment_submissions/);
  assert.match(learnerPage, /Submit for review/);
  assert.match(learnerPage, /Needs revision/);
  assert.match(adminAction, /reviewTrainingAssessmentSubmissionAction/);
  assert.match(adminAction, /finalizeTrainingCourseIfEligible/);
  assert.match(adminPage, /Assessment submissions/);
  assert.match(adminPage, /Save review/);
});

test("course publication requires assessment readiness", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const page = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");

  assert.match(action, /Publish every assessment that belongs in this course/);
  assert.match(action, /Set a pass score for every published assessment/);
  assert.match(page, /assessmentReady/);
});

test("assessment-pending courses remain active on the learner dashboard", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");
  const dashboard = await readFile("src/app/workspace/training/page.tsx", "utf8");

  assert.match(training, /completedAt: string \| null/);
  assert.match(dashboard, /course\.enrolled && !course\.completedAt/);
  assert.match(dashboard, /nextAssessment/);
  assert.match(dashboard, /assessmentStatus/);
});


test("final assessment cannot be submitted before all published lessons are complete", async () => {
  const action = await readFile("src/app/actions/training.ts", "utf8");
  const page = await readFile("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx", "utf8");
  assert.match(action, /Complete all published lessons before submitting the final assessment/);
  assert.match(page, /Complete the lessons first/);
  assert.match(page, /course\.completedLessons === course\.lessonCount/);
});


test("lesson-only completion does not display as full course completion", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");
  assert.match(training, /completedLessons === courseLessons\.length\s*\? 95/);
  assert.match(training, /completedLessons === lessons\.length\s*\? 95/);
  assert.match(training, /enrollment\?\.completed_at\s*\? 100/);
});
