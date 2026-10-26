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

test("heartbeat validates published lesson eligibility with a shared bounded cache", async () => {
  const [actions, eligibility, adminActions] = await Promise.all([
    readFile(actionsPath, "utf8"),
    readFile("src/lib/training-published-lesson-cache.ts", "utf8"),
    readFile("src/app/actions/training-admin.ts", "utf8"),
  ]);
  const section = actions.split("export async function recordTrainingLessonEngagementAction(")[1]
    ?.split("export async function checkTrainingLessonCheckpointAction(")[0];
  assert.ok(section, "engagement action must still exist");

  // Keep auth and personal learning progress outside the shared cache.
  assert.match(section, /requireAuthenticatedUserFast/);
  assert.match(section, /getCachedPublishedLessonId\(lessonId, courseSlug\)/);
  assert.match(section, /\.eq\("user_id", userId\)/);
  assert.match(section, /\.eq\("lesson_id", validLessonId\)/);
  assert.match(section, /\.from\("training_lesson_engagement"\)/);
  assert.match(section, /upsert\(\{/);
  assert.match(section, /onConflict: "user_id,lesson_id"/);
  assert.doesNotMatch(section, /\.from\("training_lessons"\)|\.from\("training_courses"\)|\.from\("training_modules"\)/);

  // Reject arbitrary high-cardinality cache keys before invoking the cache.
  assert.match(section, /\^\[0-9a-f\]\{8\}/);
  assert.match(section, /courseSlug\.length > 120/);
  assert.match(section, /getCachedPublishedLessonId\(lessonId, courseSlug\)/);

  // Only public lesson/course publication metadata is eligible for reuse.
  assert.match(eligibility, /unstable_cache\(/);
  assert.match(eligibility, /\.from\("training_lessons"\)/);
  assert.match(eligibility, /training_modules!inner\(training_courses!inner\(slug,status\)\)/);
  assert.match(eligibility, /\.eq\("is_published", true\)/);
  assert.match(eligibility, /\.eq\("training_modules\.training_courses\.slug", courseSlug\)/);
  assert.match(eligibility, /\.eq\("training_modules\.training_courses\.status", "published"\)/);
  assert.doesNotMatch(eligibility, /\buserId\b|\.from\("training_lesson_engagement"\)/);

  // Longer than the 30-second heartbeat; edits invalidate the tag immediately.
  const ttl = Number(eligibility.match(/revalidate: (\d+)/)?.[1]);
  assert.ok(ttl > 30 && ttl <= 120, "cache TTL must produce hits without excessive staleness");
  assert.match(eligibility, /tags: \["training-curriculum"\]/);
  assert.match(adminActions, /updateTag\("training-curriculum"\)/);
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
