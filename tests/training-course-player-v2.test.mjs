import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("course overview carries the redesigned card identity into the learning experience", async () => {
  const [page, css] = await Promise.all([
    readFile(coursePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /function trainingCourseMark/);
  assert.match(page, /training-course-hero-grid/);
  assert.match(page, /training-course-identity-mark/);
  assert.match(page, /training-course-identity-state/);
  assert.match(page, /training-course-identity-progress/);
  assert.match(page, /training-course-identity-next/);
  assert.match(page, /training-module-progress/);
  assert.match(page, /training-lesson-state/);
  assert.match(page, /Up next/);
  assert.match(page, /Not started/);

  assert.match(css, /\/\* Course overview \+ lesson player v2 \*\//);
  assert.match(css, /\.training-course-hero-grid/);
  assert.match(css, /\.training-course-identity/);
  assert.match(css, /\.training-module-progress/);
  assert.match(css, /\.training-lesson-state\.is-next/);
});

test("lesson player keeps course identity, module context, and outline visible", async () => {
  const [page, css] = await Promise.all([
    readFile(lessonPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(page, /function trainingCourseMark/);
  assert.match(page, /training-player-progress-v2/);
  assert.match(page, /training-player-progress-mark/);
  assert.match(page, /training-player-lesson-position/);
  assert.match(page, /<details className="card training-player-outline" open>/);
  assert.match(page, /Lesson \{lessonIndex \+ 1\} of \{course\.lessonCount\}/);

  assert.match(css, /\.training-player-progress\.training-player-progress-v2/);
  assert.match(css, /\.training-player-progress-mark/);
  assert.match(css, /\.training-player-lesson-position/);
  assert.match(css, /\.training-player-page \.training-player-outline/);
});

test("course overview and lesson player stay single-column on smaller screens", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 900px\)[\s\S]*\.training-course-hero-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-player-progress\.training-player-progress-v2/);
  assert.match(css, /\.training-course-identity[\s\S]*grid-template-columns: 1fr/);
});
