import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Australian Allied Health overview foregrounds safe admin outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-australian-allied-health-course/);
  assert.match(page, /An allied-health administration control pack/);
  assert.match(page, /Patient \+ referral readiness tracker/);
  assert.match(page, /Scheduling \+ recall control board/);
  assert.match(page, /Privacy \+ incident escalation log/);
  assert.match(page, /Billing \+ practitioner handoff/);
});

test("Australian Bookkeeping overview foregrounds finance-control outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-australian-bookkeeping-course/);
  assert.match(page, /An Australian bookkeeping control pack/);
  assert.match(page, /Authority \+ source-evidence map/);
  assert.match(page, /AP \+ AR control queues/);
  assert.match(page, /Bank \+ payroll exception worksheet/);
  assert.match(page, /Month-end \+ BAS reviewer pack/);
});

test("both lessons use the shared practical-work treatment", async () => {
  const lesson = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(lesson, /training-work-player training-australian-allied-health-player/);
  assert.match(lesson, /training-work-player training-australian-bookkeeping-player/);
  assert.match(lesson, /Allied health admin scenario/);
  assert.match(lesson, /Bookkeeping control artifact included/);
  assert.match(css, /Australia allied-health \+ bookkeeping palettes/);
  assert.match(css, /\.training-australian-allied-health-course,[\s\S]*\.training-australian-allied-health-player/);
  assert.match(css, /\.training-australian-bookkeeping-course,[\s\S]*\.training-australian-bookkeeping-player/);
});

test("the UI is backed by existing practical curriculum and finals", async () => {
  const allied = await read("supabase/migrations/20260923062100_build_australian_allied_health.sql");
  const alliedArtifacts = await read("supabase/migrations/20260924135000_finish_servicem8_allied_health_artifacts.sql");
  const bookkeeping = await read("supabase/migrations/20260923062300_build_australian_bookkeeping.sql");
  const bookkeepingDepth = await read("supabase/migrations/20260924190000_deepen_australian_bookkeeping_practical_training.sql");

  assert.match(allied, /Australian Allied Health Administration Final Work Simulation/);
  assert.match(allied, /'practical'/);
  assert.match(alliedArtifacts, /Rivergum Allied Health administration control-desk portfolio/);
  assert.match(alliedArtifacts, /Health-information incident containment and escalation record/);

  assert.match(bookkeeping, /Australian Bookkeeping Administration Final Work Simulation/);
  assert.match(bookkeeping, /'practical'/);
  assert.match(bookkeepingDepth, /Harbour Field Services Australian bookkeeping control pack/);
  assert.match(bookkeepingDepth, /Australian month-end and BAS reviewer pack/);
});
