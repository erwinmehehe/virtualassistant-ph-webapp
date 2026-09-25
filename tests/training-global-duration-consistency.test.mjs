import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const courseSlugs = [
  "virtual-assistant-foundations",
  "executive-virtual-assistant",
  "customer-support-virtual-assistant",
  "operations-virtual-assistant",
  "project-management-for-virtual-assistants",
  "seo-virtual-assistant",
  "marketing-virtual-assistant",
  "ecommerce-virtual-assistant",
  "social-media-virtual-assistant",
  "sales-lead-generation-virtual-assistant",
  "real-estate-virtual-assistant",
  "medical-healthcare-virtual-assistant",
  "bookkeeping-administration",
  "payroll-administration",
  "airbnb-short-term-rental-virtual-assistant",
  "servicem8-for-virtual-assistants",
  "cliniko-for-virtual-assistants",
  "xero-workflows-for-virtual-assistants",
  "myob-workflows-for-virtual-assistants",
  "australian-va-fundamentals",
  "australian-trades-administration",
  "ndis-administration-fundamentals",
  "property-management-administration-australia",
  "mortgage-broking-administration-australia",
  "australian-allied-health-administration",
  "australian-bookkeeping-administration",
];

test("all 26 released course workbenches remain explicitly handled", async () => {
  const [course, lesson] = await Promise.all([
    read("src/app/workspace/training/courses/[slug]/page.tsx"),
    read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx"),
  ]);

  assert.equal(courseSlugs.length, 26);
  for (const slug of courseSlugs) {
    assert.ok(course.includes(slug), `Course overview lost explicit handling for ${slug}`);
    assert.ok(lesson.includes(slug), `Lesson player lost explicit handling for ${slug}`);
  }
});

test("lesson header duration is a colored course-aware badge", async () => {
  const [lesson, css] = await Promise.all([
    read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx"),
    read("src/app/workspace/training/training-home.css"),
  ]);

  assert.match(lesson, /badge training-player-duration-badge/);
  assert.match(lesson, /About \{lesson\.estimated_minutes\} minutes/);
  assert.match(css, /Global training duration consistency/);
  assert.match(css, /\.training-player-duration-badge[\s\S]*var\(--training-work-border, #bae6fd\)/);
  assert.match(css, /\.training-player-duration-badge[\s\S]*var\(--training-work-soft, #f0f9ff\)/);
  assert.match(css, /\.training-player-duration-badge[\s\S]*var\(--training-work-accent, #0369a1\)/);
});

test("lesson sidebar durations are colored and preserve completion state", async () => {
  const [lesson, css] = await Promise.all([
    read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx"),
    read("src/app/workspace/training/training-home.css"),
  ]);

  assert.match(lesson, /training-player-lesson-duration/);
  assert.match(lesson, /<Clock3 size=\{11\}\/?>/);
  assert.match(css, /\.training-player-lesson-duration[\s\S]*border-radius: 999px/);
  assert.match(css, /\.training-player-lesson-link\.is-current \.training-player-lesson-duration/);
  assert.match(css, /\.training-player-lesson-link\.is-complete:not\(\.is-current\) \.training-player-lesson-duration[\s\S]*background: #ecfdf3;[\s\S]*color: #067647;/);
});

test("duration treatments stay readable on phone widths", async () => {
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-player-duration-badge[\s\S]*min-height: 32px/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-player-lesson-duration[\s\S]*font-size: 10px/);
});
