import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Short-Term Rental overview foregrounds reservation operations outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-rental-course/);
  assert.match(page, /A reservation-operations pack/);
  assert.match(page, /Reservation \+ calendar control/);
  assert.match(page, /Guest messaging \+ issue queue/);
  assert.match(page, /Turnover \+ maintenance board/);
  assert.match(page, /Owner \+ shift handoff/);
});

test("Short-Term Rental lessons reuse the shared practical work treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-rental-player/);
  assert.match(page, /Property ops artifact included/);
  assert.match(css, /Short-Term Rental property-ops palette/);
  assert.match(css, /\.training-rental-course,[\s\S]*\.training-rental-player/);
  assert.match(css, /--training-work-accent: #c4320a/);
  assert.match(css, /\.training-work-player \.training-lesson-prose/);
});

test("Short-Term Rental final remains a practical operations simulation", async () => {
  const course = await read("supabase/migrations/20260923124000_write_short_term_rental_va_training.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(course, /Coastline Stays/);
  assert.match(course, /operational judgment and work output rather than platform trivia/i);
  assert.match(course, /owner and shift handoff/i);
  assert.match(page, /Practical work simulation/);
});
