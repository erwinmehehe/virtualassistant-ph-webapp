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
  assert.match(actions, /Complete the earlier lessons before finishing this lesson/);
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
