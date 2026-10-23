import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const gatePath = "src/components/training-lesson-integrity-gate.tsx";
const actionsPath = "src/app/actions/training.ts";
const lessonPagePath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";

test("active reading sync is throttled, non-overlapping and stops after server-saved evidence", async () => {
  const gate = await readFile(gatePath, "utf8");
  assert.match(gate, /setInterval\(\(\) => void heartbeat\(\), 30_000\)/);
  assert.match(gate, /document\.visibilityState !== "visible"/);
  assert.match(gate, /document\.hasFocus\(\)/);
  assert.match(gate, /lastInteractionAt\.current > 45_000/);
  assert.match(gate, /heartbeatPending \|\| savedCompletionEvidenceRef\.current/);
  assert.match(gate, /heartbeatPending = true/);
  assert.match(gate, /finally \{\s*heartbeatPending = false/);
  assert.match(gate, /savedCompletionEvidenceRef\.current = savedSeconds >= requiredActiveSeconds && savedScroll >= 85/);
  assert.match(gate, /setReadingSyncError\(true\)/);
});

test("heartbeat validates an actual published lesson/course relationship with one read", async () => {
  const actions = await readFile(actionsPath, "utf8");
  const section = actions.split("export async function recordTrainingLessonEngagementAction(")[1]
    ?.split("export async function checkTrainingLessonCheckpointAction(")[0];
  assert.ok(section, "engagement action must still exist");
  assert.match(section, /requireAuthenticatedUserFast/);
  assert.match(section, /\.from\("training_lessons"\)/);
  assert.match(section, /training_modules!inner\(training_courses!inner\(slug,status\)\)/);
  assert.match(section, /\.eq\("is_published", true\)/);
  assert.match(section, /\.eq\("training_modules\.training_courses\.slug", courseSlug\)/);
  assert.match(section, /\.eq\("training_modules\.training_courses\.status", "published"\)/);
  assert.doesNotMatch(section, /\.from\("training_courses"\)|\.from\("training_modules"\)/);
  assert.match(section, /\.from\("training_lesson_engagement"\)/);
  assert.match(section, /upsert\(\{/);
  assert.match(section, /onConflict: "user_id,lesson_id"/);
});

test("new lesson resets the client heartbeat and keeps lesson completion guard", async () => {
  const [page, actions] = await Promise.all([
    readFile(lessonPagePath, "utf8"),
    readFile(actionsPath, "utf8"),
  ]);
  assert.match(page, /<TrainingLessonIntegrityGate\s+key=\{lesson\.id\}/);
  assert.match(actions, /failLessonCompletion\("sequence"\)/);
  assert.match(actions, /checkpoint_key !== checkpoint\.checkpointKey/);
});
