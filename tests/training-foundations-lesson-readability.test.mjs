import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("Foundations lesson player exposes scan-friendly content hooks", async () => {
  const page = await readFile(lessonPath, "utf8");

  assert.match(page, /training-foundations-player/);
  assert.match(page, /virtual-assistant-foundations/);
  assert.match(page, /training-lesson-section-heading/);
  assert.match(page, /training-lesson-paragraph/);
  assert.match(page, /training-lesson-list/);
  assert.match(page, /training-lesson-steps/);
  assert.match(page, /training-scenario-block/);
});

test("Foundations readability styling is scoped and mobile friendly", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /Foundations lesson readability pass/);
  assert.match(css, /\.training-foundations-player \.training-lesson-prose/);
  assert.match(css, /max-width: 720px/);
  assert.match(css, /font-size: 16px/);
  assert.match(css, /counter-reset: training-foundation-step/);
  assert.match(css, /\.training-foundations-player \.training-scenario-block/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-foundations-player \.training-lesson-prose/);
  assert.match(css, /min-height: 44px/);
});

test("lesson sidebar uses final-check language instead of internal assessment wording", async () => {
  const page = await readFile(lessonPath, "utf8");

  assert.match(page, /go straight to the final check/);
  assert.doesNotMatch(page, /go straight to the assessment/);
});
