import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Customer Support overview foregrounds real queue outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-support-course/);
  assert.match(page, /What you will actually build/);
  assert.match(page, /Queue triage board/);
  assert.match(page, /Reply \+ case record/);
  assert.match(page, /Policy \+ escalation control/);
  assert.match(page, /QA \+ shift handoff/);
});

test("Customer Support lesson player has a scoped queue-work mode", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-support-player/);
  assert.match(page, /Queue work included/);
  assert.match(css, /Customer Support queue-work pass/);
  assert.match(css, /\.training-support-player \.training-lesson-prose/);
  assert.match(css, /counter-reset: support-va-step/);
  assert.match(css, /\.training-support-player \.training-scenario-block/);
  assert.match(css, /\.training-support-player \.training-exercise-block/);
  assert.match(css, /\.training-support-player \.training-checklist-block/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-support-player \.training-lesson-prose/);
});

test("Customer Support final remains a practical work simulation", async () => {
  const roadmap = await read("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql");
  const course = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(roadmap, /customer-support-virtual-assistant/);
  assert.match(roadmap, /Customer Support Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /'practical', null, 1, false/);
  assert.match(course, /Practical work simulation/);
});
