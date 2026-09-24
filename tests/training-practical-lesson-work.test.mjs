import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const trainingPath = "src/lib/training.ts";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const practiceComponentPath = "src/components/training-practice-blocks.tsx";
const adminActionPath = "src/app/actions/training-admin.ts";
const adminLessonPath = "src/app/workspace/admin/training/[courseId]/lessons/[lessonId]/page.tsx";
const trainingAdminPath = "src/lib/training-admin.ts";
const cssPath = "src/app/workspace/training/training-home.css";
const migrationPath = "supabase/migrations/20260924094500_foundations_practical_lesson_work.sql";

test("lesson content model supports practical work, reusable templates, and QA checklists", async () => {
  const training = await readFile(trainingPath, "utf8");

  assert.match(training, /type: "exercise"/);
  assert.match(training, /deliverable\?: string/);
  assert.match(training, /type: "template"/);
  assert.match(training, /type: "checklist"/);
});

test("learner lesson player renders clear practice deliverables and reusable resources", async () => {
  const [lesson, practice] = await Promise.all([
    readFile(lessonPath, "utf8"),
    readFile(practiceComponentPath, "utf8"),
  ]);

  assert.match(lesson, /Practice task/);
  assert.match(lesson, /Your deliverable/);
  assert.match(lesson, /TrainingTemplateBlock/);
  assert.match(lesson, /TrainingChecklistBlock/);

  assert.match(practice, /Use this template/);
  assert.match(practice, /Copy template/);
  assert.match(practice, /navigator\.clipboard\.writeText/);
  assert.match(practice, /QA checklist/);
  assert.match(practice, /type="checkbox"/);
  assert.match(practice, /Reset/);
});

test("training admin can create and edit the new practical block types", async () => {
  const [actions, admin, loader] = await Promise.all([
    readFile(adminActionPath, "utf8"),
    readFile(adminLessonPath, "utf8"),
    readFile(trainingAdminPath, "utf8"),
  ]);

  assert.match(actions, /type === "exercise"/);
  assert.match(actions, /type === "template"/);
  assert.match(actions, /type === "checklist"/);
  assert.match(actions, /block_output/);

  assert.match(admin, /Practice task \+ deliverable/);
  assert.match(admin, /Reusable template/);
  assert.match(admin, /QA checklist/);
  assert.match(admin, /Expected deliverable/);
  assert.match(loader, /"exercise", "template", "checklist"/);
});

test("Foundations practical migration enriches every published learner lesson without changing lesson IDs", async () => {
  const migration = await readFile(migrationPath, "utf8");
  const expectedSlugs = [
    "what-a-virtual-assistant-actually-does",
    "clear-written-client-communication",
    "inbox-management",
    "calendar-and-meeting-coordination",
    "drive-docs-and-file-organization",
    "spreadsheets-for-va-admin-work",
    "task-management-and-prioritization",
    "research-and-source-verification",
    "responsible-ai-for-va-work",
    "reading-briefs-sops-and-working-independently",
  ];

  for (const slug of expectedSlugs) {
    assert.ok(migration.includes("'" + slug + "'"), "Missing practical lesson content for " + slug);
  }

  assert.equal((migration.match(/'type', 'exercise'/g) || []).length, 1);
  assert.equal((migration.match(/'type', 'template'/g) || []).length, 1);
  assert.equal((migration.match(/'type', 'checklist'/g) || []).length, 1);
  assert.match(migration, /l\.content \|\| jsonb_build_array/);
  assert.match(migration, /where block->>'type' = 'exercise'/);
  assert.doesNotMatch(migration, /delete from public\.training_lessons/i);
  assert.doesNotMatch(migration, /insert into public\.training_lessons/i);
});

test("practical blocks have compact mobile styling", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.training-exercise-block/);
  assert.match(css, /\.training-template-block/);
  assert.match(css, /\.training-checklist-block/);
  assert.match(css, /\.training-exercise-deliverable/);
  assert.match(css, /\.training-checklist-items/);
  assert.match(css, /@media \(max-width: 430px\)/);
});
