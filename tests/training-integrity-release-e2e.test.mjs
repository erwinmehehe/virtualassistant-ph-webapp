import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = (path) => readFile(path, "utf8");

test("release path remains connected from anti-skip lesson work to automatic certificate", async () => {
  const [gate, actions, assessment, completion, credential, css] = await Promise.all([
    source("src/components/training-lesson-integrity-gate.tsx"),
    source("src/app/actions/training.ts"),
    source("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx"),
    source("src/lib/training-completion.ts"),
    source("src/app/training/certificates/[code]/page.tsx"),
    source("src/app/workspace/training/training-home.css"),
  ]);

  // Reading cannot accrue from an abandoned/background tab.
  assert.match(gate, /document\.visibilityState !== "visible"/);
  assert.match(gate, /document\.hasFocus\(\)/);
  assert.match(gate, /lastInteractionAt/);
  assert.match(gate, /> 45_000/);

  // Lesson completion is sequential and server-authoritative.
  assert.match(actions, /failLessonCompletion\("sequence"\)/);
  assert.match(actions, /max_scroll_percent/);
  assert.match(actions, /checkpoint_key !== checkpoint\.checkpointKey/);
  assert.match(actions, /exerciseResponse\.length < 80/);

  // Final check is randomized, rate-limited, and server-scored.
  assert.match(actions, /buildAssessmentQuestionsFromLessons/);
  assert.match(actions, /recentAttempts\.length >= 3/);
  assert.match(actions, /Math\.round\(\(correct \/ questions\.length\) \* 100\)/);
  assert.match(assessment, /Fresh mix each attempt/);
  assert.match(assessment, /answer key is not shown/i);
  assert.match(assessment, /3 attempts in a rolling 24-hour period/);
  assert.match(assessment, /Review and try again/);

  // Passing immediately enters the existing completion/certificate path.
  assert.match(actions, /finalizeTrainingCourseIfEligible/);
  assert.match(actions, /training_certificate_issued/);
  assert.match(completion, /training_certificates/);
  assert.match(credential, /Certificate of completion/);
  assert.match(credential, /Verified/);

  // Phone release coverage stays in the shipped stylesheet.
  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /@media \(max-width: 390px\)/);
  assert.match(css, /training-integrity-gate/);
  assert.match(css, /training-auto-question/);
});


test("final assessment failure, retry, pass, and certificate states stay connected", async () => {
  const [actions, assessment, completion] = await Promise.all([
    source("src/app/actions/training.ts"),
    source("src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx"),
    source("src/lib/training-completion.ts"),
  ]);

  // Expected learner mistakes and stale forms return to the assessment instead of throwing raw errors.
  assert.match(actions, /failAssessmentSubmission\("lessons"\)/);
  assert.match(actions, /failAssessmentSubmission\("stale"\)/);
  assert.match(actions, /failAssessmentSubmission\("limit"\)/);
  assert.match(actions, /failAssessmentSubmission\("question_set"\)/);
  assert.match(assessment, /assessment_error/);
  assert.match(assessment, /This attempt is out of date/);
  assert.match(assessment, /question set is no longer valid/i);

  // A failed attempt is persisted as needs_revision and feeds lesson-level retry guidance.
  assert.match(actions, /status: passed \? "reviewed" : "needs_revision"/);
  assert.match(actions, /missed_lesson_ids: missedLessonIds/);
  assert.match(assessment, /Review and try again/);
  assert.match(assessment, /Try again/);
  assert.match(assessment, /missedLessons/);

  // The next attempt increments from persisted submissions and receives a fresh question set.
  assert.match(actions, /const nextAttempt = attemptRows\.length \+ 1/);
  assert.match(actions, /attemptNumber: nextAttempt/);
  assert.match(actions, /assessmentQuestionSetKey\(questions\)/);

  // A passing retry enters the automatic completion path and the certificate becomes visible.
  assert.match(actions, /if \(passed\) \{/);
  assert.match(actions, /finalizeTrainingCourseIfEligible\(userId, course\.id\)/);
  assert.match(completion, /training_enrollments/);
  assert.match(completion, /completed_at: completedAt/);
  assert.match(completion, /training_certificates/);
  assert.match(assessment, /course\.certificate\.credential_code/);
  assert.match(assessment, /View certificate/);
});


test("last lesson auto-handoff is visible and recorded in the training funnel", async () => {
  const [actions, lessonPage, gate] = await Promise.all([
    source("src/app/actions/training.ts"),
    source("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx"),
    source("src/components/training-lesson-integrity-gate.tsx"),
  ]);

  assert.match(actions, /lesson_number: lessonIndex \+ 1/);
  assert.match(actions, /lesson_count: orderedLessons\.length/);
  assert.match(actions, /is_final_lesson: lessonIndex === orderedLessons\.length - 1/);
  assert.match(actions, /training_assessment_open/);
  assert.match(actions, /source: "final_lesson_auto_handoff"/);
  assert.match(lessonPage, /Complete lesson & start final check/);
  assert.match(gate, /completionLabel/);
});
