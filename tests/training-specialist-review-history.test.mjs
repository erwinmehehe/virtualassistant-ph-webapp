import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("specialist review assignment migration adds revision locks and private audit history", async () => {
  const migration = await readFile("supabase/migrations/20260923153000_training_specialist_assignment_history.sql", "utf8");
  assert.match(migration, /assigned_reviewer_name text/);
  assert.match(migration, /review_due_date date/);
  assert.match(migration, /review_revision integer not null default 1/);
  assert.match(migration, /assigned_revision integer/);
  assert.match(migration, /create table if not exists public\.training_specialist_review_events/);
  assert.match(migration, /event_type in \(/);
  assert.match(migration, /'approved'/);
  assert.match(migration, /'invalidated'/);
  assert.match(migration, /alter table public\.training_specialist_review_events enable row level security/);
  assert.match(migration, /revoke all on public\.training_specialist_review_events from anon, authenticated/);
  assert.match(migration, /grant select, insert on public\.training_specialist_review_events to service_role/);
  assert.match(migration, /training_specialist_review_events_append_only/);
  assert.match(migration, /raise exception 'training specialist review history is append-only'/);
});

test("specialist reviewer assignment locks work to the current review revision", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /assignTrainingSpecialistReviewerAction/);
  assert.match(action, /assigned_revision: reviewRevision/);
  assert.match(action, /review_due_date: reviewDueDate/);
  assert.match(action, /event_type: eventType/);
  assert.match(action, /Refresh the reviewer assignment for the current revision first/);
  assert.match(action, /review\.assigned_revision !== review\.review_revision/);
});

test("course edits invalidate specialist evidence and advance the review revision", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /const nextRevision = Math\.max\(1, Number\(review\.review_revision \|\| 1\) \+ 1\)/);
  assert.match(action, /review_revision: nextRevision/);
  assert.match(action, /event_type: "invalidated"/);
  assert.match(action, /reviewer_name: null/);
  assert.match(action, /reviewed_at: null/);
});

test("specialist decisions write immutable review events with actor and version evidence", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /training_specialist_review_events/);
  assert.match(action, /actor_id: session\.userId/);
  assert.match(action, /actor_label: session\.profile\.full_name \|\| "Admin"/);
  assert.match(action, /course_content_version: course\.content_version/);
  assert.match(action, /"changes_requested"/);
  assert.match(action, /"progress_saved"/);
  assert.match(action, /"approved"/);
});

test("publishing requires an approved current specialist revision", async () => {
  const action = await readFile("src/app/actions/training-admin.ts", "utf8");
  assert.match(action, /specialistReview\?\.decision !== "approved"/);
  assert.match(action, /specialistReview\?\.assigned_revision !== specialistReview\?\.review_revision/);
  assert.match(action, /Complete the current specialist review revision before publishing this course/);
});

test("specialist review queue shows assignment, due date, stale revision state, and history", async () => {
  const page = await readFile("src/app/workspace/admin/training/reviews/page.tsx", "utf8");
  const admin = await readFile("src/lib/training-admin.ts", "utf8");
  assert.match(page, /Reviewer assignment/);
  assert.match(page, /Refresh assignment/);
  assert.match(page, /Due date/);
  assert.match(page, /Refresh required/);
  assert.match(page, /Review history/);
  assert.match(page, /Immutable assignment and decision events/);
  assert.match(admin, /assignmentCurrent/);
  assert.match(admin, /training_specialist_review_events/);
  assert.match(admin, /assigned_revision === review\.review_revision/);
});
