import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Operations overview foregrounds real operating artifacts", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-operations-course/);
  assert.match(page, /An operations control pack/);
  assert.match(page, /Process \+ SOP controls/);
  assert.match(page, /Exception \+ dependency board/);
  assert.match(page, /KPI \+ reconciliation pack/);
  assert.match(page, /Incident \+ shift handoff/);
});

test("Project Management overview foregrounds project control artifacts", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-project-course/);
  assert.match(page, /A project control pack/);
  assert.match(page, /Charter \+ scope baseline/);
  assert.match(page, /Milestone \+ dependency plan/);
  assert.match(page, /RAID \+ change control/);
  assert.match(page, /Status \+ handover pack/);
});

test("Operations and PM share a scoped control-work lesson treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-operations-player/);
  assert.match(page, /training-work-player training-project-player/);
  assert.match(page, /Operations artifact included/);
  assert.match(page, /Project artifact included/);
  assert.match(css, /Operations \+ Project Management control-work pass/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
  assert.match(css, /counter-reset: control-work-step/);
  assert.match(css, /\.training-work-player \.training-scenario-block/);
  assert.match(css, /\.training-work-player \.training-exercise-block/);
  assert.match(css, /\.training-work-player \.training-checklist-block/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-work-player \.training-lesson-prose/);
});

test("Operations and PM finals remain practical work simulations", async () => {
  const roadmap = await read("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql");
  const course = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(roadmap, /operations-virtual-assistant/);
  assert.match(roadmap, /project-management-for-virtual-assistants/);
  assert.match(roadmap, /Operations Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /Project Management for Virtual Assistants Final Work Simulation/);
  assert.match(course, /Practical work simulation/);
});
