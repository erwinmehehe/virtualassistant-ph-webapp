import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Marketing overview foregrounds campaign operations outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-marketing-course/);
  assert.match(page, /A campaign operations pack/);
  assert.match(page, /Campaign brief \+ claim register/);
  assert.match(page, /Content \+ production board/);
  assert.match(page, /Launch \+ asset QA/);
  assert.match(page, /CRM \+ campaign reporting/);
});

test("E-commerce overview foregrounds store operations outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-ecommerce-course/);
  assert.match(page, /A store operations pack/);
  assert.match(page, /Catalog \+ SKU control/);
  assert.match(page, /Order \+ fulfilment exception queue/);
  assert.match(page, /Inventory \+ promotion QA/);
  assert.match(page, /Store reporting \+ handoff/);
});

test("Social Media overview foregrounds social operations outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-social-course/);
  assert.match(page, /A social operations pack/);
  assert.match(page, /Content \+ approval calendar/);
  assert.match(page, /Publishing \+ asset QA/);
  assert.match(page, /Moderation \+ escalation log/);
  assert.match(page, /Performance \+ handoff report/);
});

test("Marketing, E-commerce and Social share the practical work learner treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-marketing-player/);
  assert.match(page, /training-work-player training-ecommerce-player/);
  assert.match(page, /training-work-player training-social-player/);
  assert.match(page, /Campaign artifact included/);
  assert.match(page, /Store ops artifact included/);
  assert.match(page, /Social ops artifact included/);
  assert.match(css, /Marketing \+ E-commerce \+ Social work palettes/);
  assert.match(css, /\.training-marketing-course,[\s\S]*\.training-marketing-player/);
  assert.match(css, /\.training-ecommerce-course,[\s\S]*\.training-ecommerce-player/);
  assert.match(css, /\.training-social-course,[\s\S]*\.training-social-player/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
});

test("all three finals remain practical work simulations", async () => {
  const roadmap = await read("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(roadmap, /Marketing Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /E-commerce Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /Social Media Virtual Assistant Final Work Simulation/);
  assert.match(page, /Practical work simulation/);
});
