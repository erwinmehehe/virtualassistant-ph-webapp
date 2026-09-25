import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("ServiceM8 overview foregrounds field-service workflow outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-servicem8-course/);
  assert.match(page, /A field-service operations pack/);
  assert.match(page, /Job \+ queue control/);
  assert.match(page, /Schedule \+ dispatch board/);
  assert.match(page, /Quote \+ completion evidence/);
  assert.match(page, /Invoice \+ accounting handoff/);
});

test("Cliniko overview foregrounds allied-health admin outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-cliniko-course/);
  assert.match(page, /An allied-health admin pack/);
  assert.match(page, /Patient \+ authority QA/);
  assert.match(page, /Appointment \+ reminder control/);
  assert.match(page, /Invoice \+ payment exception queue/);
  assert.match(page, /Privacy \+ Xero handoff/);
});

test("Xero and MYOB foreground finance-control outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-xero-course/);
  assert.match(page, /A Xero finance-admin control pack/);
  assert.match(page, /Bank \+ JAX reconciliation worksheet/);
  assert.match(page, /Month-end reviewer pack/);

  assert.match(page, /training-myob-course/);
  assert.match(page, /A MYOB finance-admin control pack/);
  assert.match(page, /Sales \+ purchases control queue/);
  assert.match(page, /Bank-feed exception worksheet/);
  assert.match(page, /Finance review handoff/);
});

test("Australia software lessons use shared practical-work modes and badges", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-servicem8-player/);
  assert.match(page, /training-work-player training-cliniko-player/);
  assert.match(page, /training-work-player training-xero-player/);
  assert.match(page, /training-work-player training-myob-player/);
  assert.match(page, /Service workflow artifact included/);
  assert.match(page, /Practice admin artifact included/);
  assert.match(page, /Xero control artifact included/);
  assert.match(page, /MYOB control artifact included/);

  assert.match(css, /Australia software-workflow palettes/);
  assert.match(css, /\.training-servicem8-course,[\s\S]*\.training-servicem8-player/);
  assert.match(css, /\.training-cliniko-course,[\s\S]*\.training-cliniko-player/);
  assert.match(css, /\.training-xero-course,[\s\S]*\.training-xero-player/);
  assert.match(css, /\.training-myob-course,[\s\S]*\.training-myob-player/);
});

test("the four software courses already contain practical work, so the UI does not invent it", async () => {
  const servicem8 = await read("supabase/migrations/20260924135000_finish_servicem8_allied_health_artifacts.sql");
  const cliniko = await read("supabase/migrations/20260924161500_deepen_cliniko_practical_training.sql");
  const finance = await read("supabase/migrations/20260924164000_deepen_xero_myob_practical_training.sql");

  assert.match(servicem8, /servicem8-for-virtual-assistants/);
  assert.match(servicem8, /exercise/i);
  assert.match(cliniko, /cliniko-for-virtual-assistants/);
  assert.match(cliniko, /exercise/i);
  assert.match(finance, /xero-workflows-for-virtual-assistants/);
  assert.match(finance, /myob-workflows-for-virtual-assistants/);
  assert.match(finance, /exercise_title/);
});
