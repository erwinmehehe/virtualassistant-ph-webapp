import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Real Estate overview foregrounds practical property operations outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-real-estate-course/);
  assert.match(page, /A real-estate operations pack/);
  assert.match(page, /Lead \+ CRM action queue/);
  assert.match(page, /Listing \+ property QA pack/);
  assert.match(page, /Viewing \+ transaction tracker/);
  assert.match(page, /Maintenance \+ daily handoff/);
});

test("Healthcare overview foregrounds safe administrative work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-healthcare-course/);
  assert.match(page, /A healthcare admin control pack/);
  assert.match(page, /Patient intake \+ scheduling QA/);
  assert.match(page, /Referral \+ records tracker/);
  assert.match(page, /Billing \+ claims exception queue/);
  assert.match(page, /Privacy-safe shift handoff/);
  assert.match(page, /without making clinical, coding, or treatment decisions/);
});

test("Real Estate and Healthcare share the practical work lesson treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-real-estate-player/);
  assert.match(page, /training-work-player training-healthcare-player/);
  assert.match(page, /Property ops artifact included/);
  assert.match(page, /Healthcare admin artifact included/);
  assert.match(css, /Real Estate \+ Healthcare work palettes/);
  assert.match(css, /\.training-real-estate-course,[\s\S]*\.training-real-estate-player/);
  assert.match(css, /\.training-healthcare-course,[\s\S]*\.training-healthcare-player/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
});

test("both course finals remain practical work simulations", async () => {
  const realEstate = await read("supabase/migrations/20260923053000_write_real_estate_va_training.sql");
  const healthcare = await read("supabase/migrations/20260923110000_write_medical_healthcare_va_training.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(realEstate, /assessment_type = 'practical'/);
  assert.match(realEstate, /prioritized work queue/i);
  assert.match(realEstate, /end-of-day handoff/i);
  assert.match(healthcare, /Composite Healthcare Admin Simulation/);
  assert.match(healthcare, /prioritized work queue/i);
  assert.match(healthcare, /privacy-incident note/i);
  assert.match(page, /Practical work simulation/);
});
