import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessonPagePath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPagePath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const trainingActionsPath = "src/app/actions/training.ts";
const integrityComponentPath = "src/components/training-lesson-integrity-gate.tsx";
const integrityLibPath = "src/lib/training-integrity.ts";
const trainingLibPath = "src/lib/training.ts";
const cssPath = "src/app/workspace/training/training-home.css";

test("lesson player shows progress, outline, practical content, and integrity gate", async () => {
  const [lessonPage, css] = await Promise.all([
    readFile(lessonPagePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(lessonPage, /Lesson \{lessonIndex \+ 1\} of \{course\.lessonCount\}/);
  assert.match(lessonPage, /training-player-progress/);
  assert.match(lessonPage, /training-player-outline/);
  assert.match(lessonPage, /aria-current/);
  assert.match(lessonPage, /training-practice-block/);
  assert.match(lessonPage, /training-note-block/);
  assert.match(lessonPage, /TrainingLessonIntegrityGate/);

  assert.match(css, /\.training-player-layout/);
  assert.match(css, /\.training-player-sidebar/);
  assert.match(css, /\.training-practice-block/);
  assert.match(css, /\.training-integrity-gate/);
});

test("lesson completion enforces active reading, content progress, checkpoint, practical work, and sequence", async () => {
  const [actions, component, integrity, page] = await Promise.all([
    readFile(trainingActionsPath, "utf8"),
    readFile(integrityComponentPath, "utf8"),
    readFile(integrityLibPath, "utf8"),
    readFile(lessonPagePath, "utf8"),
  ]);

  assert.match(actions, /training_lesson_engagement/);
  assert.match(actions, /requiredActiveSeconds/);
  assert.match(actions, /max_scroll_percent/);
  assert.match(actions, /checkpoint_key/);
  assert.match(actions, /exerciseResponse\.length < 80/);
  assert.match(actions, /failLessonCompletion\("sequence"\)/);

  assert.match(component, /document\.visibilityState !== "visible"/);
  assert.match(component, /document\.hasFocus\(\)/);
  assert.match(component, /lastInteractionAt/);
  assert.match(component, /> 45_000/);
  assert.match(component, /20_000/);
  assert.match(component, /Check answer/);
  assert.match(component, /Complete lesson when ready/);
  assert.match(page, /lessonCompletionErrorCopy/);
  assert.match(page, /training-lesson-completion-error/);
  assert.match(page, /Almost there\./);
  assert.match(component, /Ready to complete this lesson\?/);
  assert.match(component, /Still to do:/);

  assert.match(integrity, /Math\.max\(60, Math\.min\(300/);
  assert.match(integrity, /buildLessonCheckpoint/);
  assert.match(integrity, /stableShuffle/);
});

test("automatic final assessment randomizes, rate limits, scores server-side, and never reveals the answer key", async () => {
  const [assessmentPage, actions, integrity] = await Promise.all([
    readFile(assessmentPagePath, "utf8"),
    readFile(trainingActionsPath, "utf8"),
    readFile(integrityLibPath, "utf8"),
  ]);

  assert.match(assessmentPage, /buildAssessmentQuestions/);
  assert.match(assessmentPage, /publicAssessmentQuestions/);
  assert.match(assessmentPage, /Fresh mix each attempt/);
  assert.match(assessmentPage, /Review and try again/);
  assert.match(assessmentPage, /id="final-check-questions"/);
  assert.match(assessmentPage, /attemptNumber/);
  assert.match(assessmentPage, /3 attempts in a rolling 24-hour period|3-attempt limit/i);
  assert.match(assessmentPage, /answer key is not shown/i);

  assert.match(actions, /buildAssessmentQuestionsFromLessons/);
  assert.match(actions, /recentAttempts\.length >= 3/);
  assert.match(actions, /Math\.round\(\(correct \/ questions\.length\) \* 100\)/);
  assert.match(actions, /status: passed \? "reviewed" : "needs_revision"/);
  assert.match(actions, /The answer key is not shown/);
  assert.match(actions, /finalizeTrainingCourseIfEligible/);

  assert.match(integrity, /attemptNumber/);
  assert.match(integrity, /questionCount \|\| 8/);
});

test("passed assessment surfaces automatic completion and the issued certificate", async () => {
  const [assessmentPage, trainingLib] = await Promise.all([
    readFile(assessmentPagePath, "utf8"),
    readFile(trainingLibPath, "utf8"),
  ]);

  assert.match(assessmentPage, /Course complete/);
  assert.match(assessmentPage, /course\.certificate\.credential_code/);
  assert.match(assessmentPage, /View certificate/);
  assert.match(assessmentPage, /TrainingCertificateActions/);
  assert.match(assessmentPage, />\s*My learning\s*</);

  assert.match(trainingLib, /certificate: CertificateRow \| null/);
  assert.match(trainingLib, /from\("training_certificates"\)/);
  assert.match(trainingLib, /certificateData as CertificateRow/);
});

test("lesson and automatic assessment UI stays compact on phone screens", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /\.training-player-footer-nav/);
  assert.match(css, /flex-direction: column-reverse/);
  assert.match(css, /\.training-assessment-journey/);
  assert.match(css, /\.training-completion-card/);
  assert.match(css, /\.training-integrity-status-grid/);
  assert.match(css, /\.training-auto-question/);
  assert.match(css, /font-size: 16px/);
});
