import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Sales and Lead Gen overview foregrounds pipeline work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-sales-course/);
  assert.match(page, /A sales-support control pack/);
  assert.match(page, /ICP \+ prospect research pack/);
  assert.match(page, /CRM \+ sequence control/);
  assert.match(page, /Qualification \+ booking handoff/);
  assert.match(page, /Pipeline \+ funnel report/);
});

test("Sales lessons reuse the shared practical work treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-sales-player/);
  assert.match(page, /Pipeline artifact included/);
  assert.match(css, /Sales pipeline-work palette/);
  assert.match(css, /\.training-sales-course,[\s\S]*\.training-sales-player/);
  assert.match(css, /--training-work-accent: #b42318/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
});

test("Sales final remains a practical work simulation", async () => {
  const roadmap = await read("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(roadmap, /Sales & Lead Generation Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /'sales-lead-generation-virtual-assistant'/);
  assert.match(roadmap, /'practical', null, 1, false/);
  assert.match(page, /Practical work simulation/);
});
