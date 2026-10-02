import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const overviewPath = "src/components/training-dashboard-overview.tsx";
const trainingLibPath = "src/lib/training.ts";
const shellPath = "src/components/training-shell.tsx";
const savedActionPath = "src/app/actions/training-saved-courses.ts";
const notificationActionPath = "src/app/actions/training-notifications.ts";
const migrationPath = "supabase/migrations/20261002125500_training_saved_courses_and_notifications.sql";

test("training dashboard uses backend saved courses instead of localStorage", async () => {
  const [overview, trainingLib, action, migration] = await Promise.all([
    readFile(overviewPath, "utf8"),
    readFile(trainingLibPath, "utf8"),
    readFile(savedActionPath, "utf8"),
    readFile(migrationPath, "utf8"),
  ]);

  assert.match(trainingLib, /from\("training_saved_courses"\)/);
  assert.match(trainingLib, /savedCourseIds/);
  assert.match(overview, /initialSavedCourseIds/);
  assert.match(overview, /toggleTrainingSavedCourseAction/);
  assert.doesNotMatch(overview, /localStorage/);
  assert.match(action, /requireAuthenticatedUserFast/);
  assert.match(action, /from\("training_saved_courses"\)/);
  assert.match(migration, /create table if not exists public\.training_saved_courses/);
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
});

test("training topbar notifications read and mutate backend learner notifications", async () => {
  const [shell, action, migration, lockMigration] = await Promise.all([
    readFile(shellPath, "utf8"),
    readFile(notificationActionPath, "utf8"),
    readFile(migrationPath, "utf8"),
    readFile("supabase/migrations/20261002131500_lock_training_notification_content.sql", "utf8"),
  ]);

  assert.match(shell, /notifications\.map/);
  assert.match(shell, /openTrainingNotificationAction/);
  assert.match(shell, /markAllTrainingNotificationsReadAction/);
  assert.match(action, /from\("training_notifications"\)/);
  assert.match(action, /read_at/);
  assert.match(migration, /create table if not exists public\.training_notifications/);
  assert.match(migration, /references auth\.users\(id\)/);
  assert.match(migration, /grant update \(read_at\) on public\.training_notifications to authenticated/);
});

test("course completion creates learner notifications in the backend", async () => {
  const [completion, trainingAction] = await Promise.all([
    readFile("src/lib/training-completion.ts", "utf8"),
    readFile("src/app/actions/training.ts", "utf8"),
  ]);

  assert.match(completion, /from\("training_notifications"\)\.upsert/);
  assert.match(completion, /course_completed/);
  assert.match(completion, /certificate_issued/);
  assert.match(trainingAction, /assessment_retry/);
});


test("Ask Kiro is grounded in authenticated backend training data", async () => {
  const [action, ai] = await Promise.all([
    readFile("src/app/actions/training-kiro.ts", "utf8"),
    readFile("src/lib/ai-training-kiro.ts", "utf8"),
  ]);

  assert.match(action, /requireAuthenticatedUserFast/);
  assert.match(action, /answerTrainingKiro/);
  assert.match(ai, /getTrainingDashboard\(userId\)/);
  assert.match(ai, /Training is free and separate from hiring/);
  assert.match(ai, /savedCourseIds/);
  assert.match(ai, /progressPercent/);
  assert.match(ai, /certificateCode/);
  assert.match(ai, /AI_GATEWAY_API_KEY/);
  assert.match(ai, /source: "fallback"/);
});
