import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const cleanupPath = "supabase/migrations/20261004112000_remove_training_specialist_system.sql";

test("training no longer contains an active specialist review subsystem", async () => {
  const [action, adminLib, inventory, coursePage, cleanup] = await Promise.all([
    readFile("src/app/actions/training-admin.ts", "utf8"),
    readFile("src/lib/training-admin.ts", "utf8"),
    readFile("src/app/workspace/admin/training/page.tsx", "utf8"),
    readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8"),
    readFile(cleanupPath, "utf8"),
  ]);

  for (const source of [action, adminLib, inventory, coursePage]) {
    assert.doesNotMatch(source, /specialist/i);
    assert.doesNotMatch(source, /review_requirement/);
    assert.doesNotMatch(source, /training_specialist_/);
  }

  assert.match(cleanup, /drop table if exists public\.training_specialist_review_invites/);
  assert.match(cleanup, /drop table if exists public\.training_specialist_review_events/);
  assert.match(cleanup, /drop table if exists public\.training_specialist_reviews/);
  assert.match(cleanup, /drop table if exists public\.training_specialist_reviewers/);
  assert.match(cleanup, /drop function if exists public\.submit_external_training_specialist_review/);
  assert.match(cleanup, /drop column if exists review_requirement/);
  assert.match(cleanup, /drop column if exists specialist_reviewed_by/);
});

test("training publication continues with editorial, lesson, and assessment QA", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  const coursePage = await readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8");

  assert.match(action, /Record a reviewer and review date before publishing the course/);
  assert.match(action, /Every published lesson needs exactly one complete practice task, reusable template, and QA checklist/);
  assert.match(action, /Publish at least one complete practical final assessment before the course can go live/);
  assert.match(coursePage, /editorial review plus complete lesson and assessment QA/i);
});


test("learner and admin training queries match the editorial-only course schema", async () => {
  const training = await readFile("src/lib/training.ts", "utf8");

  for (const removedField of [
    "review_requirement",
    "specialist_reviewed_by",
    "specialist_reviewer_role",
    "specialist_review_notes",
    "specialist_reviewed_at",
  ]) {
    assert.doesNotMatch(training, new RegExp(removedField));
  }

  assert.match(training, /reviewed_by,last_reviewed_at,published_at,updated_at/);
});
