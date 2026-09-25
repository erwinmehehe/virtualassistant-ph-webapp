import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("SEO overview foregrounds evidence-first work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-seo-course/);
  assert.match(page, /An evidence-first SEO work pack/);
  assert.match(page, /Visibility \+ intent diagnosis/);
  assert.match(page, /Keyword \+ SERP opportunity map/);
  assert.match(page, /On-page \+ technical QA/);
  assert.match(page, /GSC \+ change validation/);
});

test("SEO lessons reuse the shared practical artifact learner treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-seo-player/);
  assert.match(page, /SEO evidence artifact included/);
  assert.match(css, /SEO evidence-work palette/);
  assert.match(css, /\.training-seo-course,[\s\S]*\.training-seo-player/);
  assert.match(css, /--training-work-accent: #175cd3/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
  assert.match(css, /\.training-work-player \.training-exercise-block/);
});

test("SEO final remains a practical work simulation", async () => {
  const roadmap = await read("supabase/migrations/20260923050000_seed_training_15_course_roadmap.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(roadmap, /SEO Virtual Assistant Final Work Simulation/);
  assert.match(roadmap, /'seo-virtual-assistant'/);
  assert.match(roadmap, /'practical', null, 1, false/);
  assert.match(page, /Practical work simulation/);
});
