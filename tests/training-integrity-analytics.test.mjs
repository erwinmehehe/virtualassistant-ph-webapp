import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const trainingPath = "src/lib/training.ts";
const adminPagePath = "src/app/workspace/admin/training/page.tsx";
const adminActionsPath = "src/app/actions/training-admin.ts";
const adminLibPath = "src/lib/training-admin.ts";

test("admin integrity analytics cover failures, first-pass rate, retries, reading time, and fast-completion signals", async () => {
  const source = await readFile(trainingPath, "utf8");

  assert.match(source, /checkpointFailureRate/);
  assert.match(source, /firstAttemptPassRate/);
  assert.match(source, /retryRate/);
  assert.match(source, /automaticFinalAttempts/);
  assert.match(source, /averageFinalScore/);
  assert.match(source, /criticalBoundaryMisses/);
  assert.match(source, /answerPatternFlags/);
  assert.match(source, /averageActiveSeconds/);
  assert.match(source, /thresholdHuggingCompletions/);
  assert.match(source, /lessonFailures/);
  assert.match(source, /training_checkpoint_attempt/);
  assert.match(source, /training_lesson_engagement/);
  assert.match(source, /training_lesson_progress/);
  assert.match(source, /automatic_knowledge_check/);
  assert.match(source, /missed_lesson_ids/);
});

test("fast completion is explicitly treated as a review signal, not proof of cheating", async () => {
  const page = await readFile(adminPagePath, "utf8");

  assert.match(page, /Learner integrity signals/);
  assert.match(page, /not automatic misconduct labels/);
  assert.match(page, /threshold-hugging completion/);
  assert.match(page, /Avg\. final score/);
  assert.match(page, /Critical misses/);
  assert.match(page, /Answer-pattern flags/);
  assert.match(page, /never an automatic cheating verdict/);
  assert.match(page, /review signal, not proof of cheating/);
  assert.match(page, /Lessons creating the most friction/);
  assert.match(page, /final-check miss/);
});

test("legacy learner-review execution paths are removed while historical submission fields remain untouched", async () => {
  const [actions, lib] = await Promise.all([
    readFile(adminActionsPath, "utf8"),
    readFile(adminLibPath, "utf8"),
  ]);

  assert.doesNotMatch(actions, /reviewTrainingAssessmentSubmissionAction/);
  assert.doesNotMatch(actions, /completion_source: "assessment_review"/);
  assert.doesNotMatch(lib, /getTrainingAssessmentSubmissionsForAdmin/);
  assert.doesNotMatch(lib, /AdminTrainingAssessmentSubmission/);
});

test("integrity analytics only use automatic-assessment attempts for pass and retry rates", async () => {
  const source = await readFile(trainingPath, "utf8");

  assert.match(source, /const automaticSubmissions = submissions\.filter/);
  assert.match(source, /row\.response\?\.kind === "automatic_knowledge_check"/);
  assert.match(source, /const firstAttempts = automaticSubmissions\.filter/);
  assert.match(source, /const retries = automaticSubmissions\.filter/);
});


test("course admin exposes calibration without exposing learner answer keys", async () => {
  const [lib, page] = await Promise.all([
    readFile(adminLibPath, "utf8"),
    readFile("src/app/workspace/admin/training/[courseId]/page.tsx", "utf8"),
  ]);

  assert.match(lib, /assessmentCalibration/);
  assert.match(lib, /firstAttemptPasses/);
  assert.match(lib, /criticalBoundaryMisses/);
  assert.match(lib, /answerPatternFlags/);
  assert.match(page, /First-attempt pass/);
  assert.match(page, /Average score/);
  assert.match(page, /Pattern flags/);
  assert.match(page, /Telemetry only/);
  assert.doesNotMatch(page, /correctOptionId/);
});
