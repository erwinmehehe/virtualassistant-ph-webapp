import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const coursePath = "src/app/workspace/training/courses/[slug]/page.tsx";
const lessonPath = "src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx";
const cssPath = "src/app/workspace/training/training-home.css";

test("course overview uses readable lesson hierarchy and explicit duration metadata", async () => {
  const [course, css] = await Promise.all([
    readFile(coursePath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(course, /training-lesson-summary/);
  assert.match(course, /training-lesson-meta/);
  assert.match(course, /<Clock3 size=\{12\}\/>{lesson\.estimated_minutes} min/);
  assert.match(course, /const isNextLesson = nextLesson\?\.id === lesson\.id/);
  assert.match(course, /lesson\.completed \? "is-complete"/);
  assert.match(course, /isNextLesson \? "is-next"/);

  assert.match(css, /\.training-course-page \.training-module-head h2[\s\S]*font-size: 19px/);
  assert.match(css, /\.training-course-page \.training-module-head p[\s\S]*font-size: 13px/);
  assert.match(css, /\.training-course-page \.training-module-label[\s\S]*font-size: 11px/);
  assert.match(css, /\.training-course-page \.training-lesson-copy \.dash-action-title strong[\s\S]*font-size: 14px/);
  assert.match(css, /\.training-course-page \.training-lesson-summary[\s\S]*font-size: 12\.5px/);
  assert.match(css, /\.training-course-page \.training-lesson-meta[\s\S]*border-radius: 999px/);
});

test("course overview visually distinguishes next and completed lessons", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.training-course-page \.training-lesson-row\.is-next/);
  assert.match(css, /\.training-course-page \.training-lesson-row\.is-complete:not\(\.is-next\)/);
  assert.match(css, /\.training-course-page \.training-lesson-row\.is-complete \.training-lesson-index/);
  assert.match(css, /background: #ecfdf3/);
  assert.match(css, /background: #eef2ff/);
});

test("single-lesson modules avoid an unnecessarily sparse two-column grid", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.training-course-page \.training-module-lessons:has\(\.training-lesson-row:only-child\)/);
  assert.match(css, /max-width: 780px/);
  assert.match(css, /@media \(max-width: 1040px\)[\s\S]*training-module-lessons[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});

test("lesson player sidebar no longer uses tiny navigation text", async () => {
  const [lesson, css] = await Promise.all([
    readFile(lessonPath, "utf8"),
    readFile(cssPath, "utf8"),
  ]);

  assert.match(lesson, /training-player-outline/);
  assert.match(lesson, /training-player-module-title/);
  assert.match(lesson, /training-player-lesson-link/);

  assert.match(css, /\.training-player-layout[\s\S]*310px/);
  assert.match(css, /\.training-player-outline summary strong[\s\S]*font-size: 14px/);
  assert.match(css, /\.training-player-outline summary small[\s\S]*font-size: 11\.5px/);
  assert.match(css, /\.training-player-module-title span[\s\S]*font-size: 10\.5px/);
  assert.match(css, /\.training-player-module-title strong[\s\S]*font-size: 12\.5px/);
  assert.match(css, /\.training-player-lesson-link strong[\s\S]*font-size: 12px/);
  assert.match(css, /\.training-player-lesson-link small[\s\S]*font-size: 10\.5px/);
});

test("lesson player keeps current and completed lessons visually distinct", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\.training-player-lesson-link\.is-current[\s\S]*border-color: #d9ddff/);
  assert.match(css, /\.training-player-lesson-link\.is-complete:not\(\.is-current\)/);
  assert.match(css, /\.training-player-lesson-link\.is-complete > span:first-child[\s\S]*background: #ecfdf3/);
});

test("375 and 390 pixel layouts retain readable course and sidebar type", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-module-head h2[\s\S]*font-size: 18px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-lesson-copy \.dash-action-title strong[\s\S]*font-size: 13\.5px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-lesson-summary[\s\S]*font-size: 12px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-player-progress-copy strong[\s\S]*font-size: 13px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*training-lesson-prose[\s\S]*font-size: 15px/);
  assert.match(css, /@media \(max-width: 390px\)/);
});
