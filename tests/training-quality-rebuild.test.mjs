import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("practical assessments store rubrics, source packs, and criterion scores", async () => {
  const migration = await readFile("supabase/migrations/20260923233000_training_assessment_quality_system.sql", "utf8");
  assert.match(migration, /add column if not exists rubric jsonb/);
  assert.match(migration, /add column if not exists resource_pack jsonb/);
  assert.match(migration, /training_assessment_submissions[\s\S]*rubric_scores jsonb/);

  const training = await readFile("src/lib/training.ts", "utf8");
  assert.match(training, /TrainingAssessmentRubricCriterion/);
  assert.match(training, /TrainingAssessmentResource/);
  assert.match(training, /rubric_scores: Record<string, number>/);
});

test("practical assessment publishing requires real evidence and grading criteria", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /Every practical assessment needs a grading rubric with at least four criteria/);
  assert.match(action, /Every practical assessment needs at least two fictional source resources/);
  assert.match(action, /Assessment rubric weights must total 100/);
  assert.match(action, /criterion\.hard_fail && value < 70/);
  assert.match(action, /rubric_scores: rubricScores/);
  assert.match(action, /score = Math\.round\(score\)/);
});

test("learner and reviewer assessment screens use the same rubric", async () => {
  const learner = await readFile("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx", "utf8");
  const admin = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");
  assert.match(learner, /Fictional client source pack/);
  assert.match(learner, /How your work will be graded/);
  assert.match(learner, /rubric_scores/);
  assert.match(admin, /Grading rubric/);
  assert.match(admin, /rubric_/);
  assert.match(admin, /overall score is calculated from the rubric weights/);
});

test("all current courses receive fictional final-assessment evidence packs", async () => {
  const seed = await readFile("supabase/migrations/20260923233500_seed_training_assessment_evidence_packs.sql", "utf8");
  const updates = seed.match(/set resource_pack =/g) || [];
  assert.equal(updates.length, 26);
  for (const slug of [
    "virtual-assistant-foundations",
    "seo-virtual-assistant",
    "bookkeeping-administration",
    "payroll-administration",
    "servicem8-for-virtual-assistants",
    "cliniko-for-virtual-assistants",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
    "ndis-administration-fundamentals",
    "property-management-administration-australia",
    "mortgage-broking-administration-australia",
  ]) {
    assert.ok(seed.includes(slug), "Missing resource pack for " + slug);
  }
  assert.match(seed, /Search Console export/);
  assert.match(seed, /Payroll variance report/);
  assert.match(seed, /Bank reconciliation exceptions/);
});

test("Foundations is consolidated to ten published lessons without deleting learner history", async () => {
  const sql = await readFile("supabase/migrations/20260923234000_consolidate_va_foundations_training.sql", "utf8");
  assert.match(sql, /estimated_minutes = 220/);
  assert.match(sql, /The VA Role, Standards, Boundaries, and Confidentiality/);
  assert.match(sql, /Client Communication, Updates, Mistakes, and Escalation/);
  assert.match(sql, /Priorities, Deadlines, Time Zones, and Handoffs/);
  assert.match(sql, /is_published = false/);
  assert.match(sql, /insert into public\.training_lesson_progress/);
  assert.match(sql, /on conflict \(user_id,lesson_id\) do nothing/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.match(sql, /status = 'published'/);
});

test("Australia lessons no longer use one identical fourteen-block teaching order", async () => {
  const sql = await readFile("supabase/migrations/20260923234500_diversify_australia_training_lessons.sql", "utf8");
  assert.match(sql, /array\[3,4,1,2,5,6,7,8,9,10,11,12,13,14\]/);
  assert.match(sql, /array\[1,2,3,4,12,5,6,7,8,10,11,9,13,14\]/);
  assert.match(sql, /array\[3,4,5,6,1,2,7,8,10,11,12,9,13,14\]/);
  assert.match(sql, /The work outcome/);
  assert.match(sql, /Where this fails in practice/);
  assert.match(sql, /QA traps/);
  assert.match(sql, /Handoff check/);
});

test("thin core courses receive lesson-specific work-product drills", async () => {
  const sql = await readFile("supabase/migrations/20260923235000_deepen_thin_core_training_courses.sql", "utf8");
  for (const slug of [
    "bookkeeping-administration",
    "sales-lead-generation-virtual-assistant",
    "social-media-virtual-assistant",
    "operations-virtual-assistant",
    "project-management-for-virtual-assistants",
    "payroll-administration",
    "airbnb-short-term-rental-virtual-assistant",
  ]) {
    assert.ok(sql.includes(slug), "Missing deepening work for " + slug);
  }
  assert.match(sql, /Work product drill/);
  assert.match(sql, /source-document exception table/);
  assert.match(sql, /UGC rights tracker/);
  assert.match(sql, /RAID-style log/);
  assert.match(sql, /payroll authority matrix/);
  assert.match(sql, /end-of-shift portfolio handoff/);
});

test("Australia finance and healthcare software courses now require specialist review", async () => {
  const migration = await readFile("supabase/migrations/20260923233000_training_assessment_quality_system.sql", "utf8");
  const definitions = await readFile("src/lib/training-specialist-review.ts", "utf8");
  for (const slug of [
    "australian-allied-health-administration",
    "cliniko-for-virtual-assistants",
    "australian-bookkeeping-administration",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
  ]) {
    assert.ok(migration.includes(slug), "Missing specialist gate migration for " + slug);
    assert.ok(definitions.includes('"' + slug + '"'), "Missing specialist checklist for " + slug);
  }
  assert.match(migration, /status = 'draft'/);
});

test("Australia courses are not duplicated in the general learner library", async () => {
  const page = await readFile("src/app/workspace/training/page.tsx", "utf8");
  assert.match(page, /course\.country_focus === "Australia"/);
  assert.match(page, /filteredNotStarted/);
  assert.match(page, /matchesFilter/);
  assert.doesNotMatch(page, /australiaCourseIds|generalCourses/);
});

test("current software refresh covers Xero, ServiceM8, Cliniko, MYOB, and NDIS", async () => {
  const sql = await readFile("supabase/migrations/20260923235500_refresh_current_software_training.sql", "utf8");
  assert.match(sql, /JAX automatic bank reconciliation/);
  assert.match(sql, /Rule, Match, Memory, and Prediction/);
  assert.match(sql, /Booking Suggestions/);
  assert.match(sql, /Awaiting Approval/);
  assert.match(sql, /six user security roles/);
  assert.match(sql, /GST reports and GST return\/BAS workflows/);
  assert.match(sql, /1 July 2026/);
});
