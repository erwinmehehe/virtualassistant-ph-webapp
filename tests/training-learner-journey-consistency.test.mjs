import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const assessmentPath = "src/app/workspace/training/courses/[slug]/assessments/[assessmentId]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("learner journey uses explicit next-step CTA language", async () => {
  const [course, lesson, assessment] = await Promise.all([
    readFile(coursePath, "utf8"),
    readFile(lessonPath, "utf8"),
    readFile(assessmentPath, "utf8"),
  ]);

  assert.match(course, /Start first lesson/);
  assert.match(course, /Continue lesson/);
  assert.match(course, /Finish last lesson/);
  assert.match(course, /Start final check/);
  assert.match(course, /View certificate/);

  assert.match(lesson, /Start final check/);
  assert.doesNotMatch(lesson, /"Start assessment"/);
  assert.match(lesson, /Finish the lesson checks below to unlock your next step/);

  assert.match(assessment, /Continue lessons/);
  assert.match(assessment, /Start final check again/);
  assert.match(assessment, /Submit final check/);
});

test("course, lesson, and final check share responsive visual continuity", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /Learner journey visual continuity/);
  assert.match(css, /\.training-course-page,[\s\S]*\.training-player-page,[\s\S]*\.training-assessment-page/);
  assert.match(css, /width: min\(100%, 1120px\)/);
  assert.match(css, /training-auto-question:focus-within/);
  assert.match(css, /label:has\(input:checked\)/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-course-progress-row/);
  assert.match(css, /min-height: 48px/);
});
