import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessonPagePath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPagePath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const trainingActionsPath = "src/app/actions/training.ts";
const trainingLibPath = "src/lib/training.ts";
const cssPath = "src/app/workspace/training/training-home.css";

test("lesson player shows progress, a compact outline, and practical content treatment", async () => {
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

  assert.match(css, /\.training-player-layout/);
  assert.match(css, /\.training-player-sidebar/);
  assert.match(css, /\.training-practice-block/);
});

test("completing a lesson saves progress and continues to the next lesson or assessment", async () => {
  const [lessonPage, actions] = await Promise.all([
    readFile(lessonPagePath, "utf8"),
    readFile(trainingActionsPath, "utf8"),
  ]);

  assert.match(lessonPage, /name="continue_to"/);
  assert.match(lessonPage, /Complete & continue/);
  assert.match(lessonPage, /Complete lesson & start assessment/);
  assert.match(lessonPage, /course\.assessments\.find/);
  assert.match(lessonPage, /assessments\/\$\{nextAssessment\.id\}/);

  assert.match(actions, /const continueTo = String\(formData\.get\("continue_to"\)/);
  assert.match(actions, /const safeContinueTo/);
  assert.match(actions, /continueTo\.startsWith/);
  assert.match(actions, /if \(safeContinueTo\) redirect\(safeContinueTo\)/);
});

test("assessment flow exposes requirements, revision recovery, and clear learner states", async () => {
  const assessmentPage = await readFile(assessmentPagePath, "utf8");

  assert.match(assessmentPage, /Before you submit/);
  assert.match(assessmentPage, /Human review/);
  assert.match(assessmentPage, /Revision needed/);
  assert.match(assessmentPage, /Review course lessons/);
  assert.match(assessmentPage, /Review pending/);
  assert.match(assessmentPage, /training-assessment-journey/);
});

test("passed assessment surfaces course completion and the issued certificate", async () => {
  const [assessmentPage, trainingLib] = await Promise.all([
    readFile(assessmentPagePath, "utf8"),
    readFile(trainingLibPath, "utf8"),
  ]);

  assert.match(assessmentPage, /Course complete/);
  assert.match(assessmentPage, /course\.certificate\.credential_code/);
  assert.match(assessmentPage, /Verify credential/);
  assert.match(assessmentPage, /TrainingCertificateActions/);
  assert.match(assessmentPage, /Continue to My learning/);

  assert.match(trainingLib, /certificate: CertificateRow \| null/);
  assert.match(trainingLib, /from\("training_certificates"\)/);
  assert.match(trainingLib, /certificateData as CertificateRow/);
});

test("lesson and completion UI stays compact on 375 and 390 pixel screens", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)/);
  assert.match(css, /\.training-player-footer-nav/);
  assert.match(css, /flex-direction: column-reverse/);
  assert.match(css, /\.training-assessment-journey/);
  assert.match(css, /\.training-completion-card/);
});
