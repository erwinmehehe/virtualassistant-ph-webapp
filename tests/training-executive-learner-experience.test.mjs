import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Executive VA course overview foregrounds real work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-executive-course/);
  assert.match(page, /What you will actually build/);
  assert.match(page, /Inbox \+ decision queue/);
  assert.match(page, /Calendar \+ meeting briefs/);
  assert.match(page, /Travel \+ disruption plan/);
  assert.match(page, /Daily handoff/);
});

test("Executive VA lesson player is scoped as a practical working desk", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-executive-player/);
  assert.match(page, /Work output included/);
  assert.match(css, /Executive VA working-desk pass/);
  assert.match(css, /\.training-executive-player \.training-lesson-prose/);
  assert.match(css, /counter-reset: executive-va-step/);
  assert.match(css, /\.training-executive-player \.training-scenario-block/);
  assert.match(css, /\.training-executive-player \.training-checklist-block/);
  assert.match(css, /@media \(max-width: 430px\)[\s\S]*\.training-executive-player \.training-lesson-prose/);
});

test("practical finals are labeled as work simulations instead of knowledge quizzes", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /hasPracticalFinal/);
  assert.match(page, /assessment\.assessment_type === "practical"/);
  assert.match(page, /Practical work simulation/);
  assert.match(page, /finish the practical work simulation to receive your certificate/);
  assert.match(page, /Randomized knowledge check/);
});
