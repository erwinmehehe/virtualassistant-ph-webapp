import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Australian VA Fundamentals foregrounds an Australia-ready operating system", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-australia-fundamentals-course/);
  assert.match(page, /A safe Australia-ready operating system/);
  assert.match(page, /Decision-rights \+ source-of-truth map/);
  assert.match(page, /Australian communication \+ scheduling/);
  assert.match(page, /Privacy \+ finance-admin boundaries/);
  assert.match(page, /Decision-focused daily handoff/);
});

test("Australian Trades foregrounds the lead-to-review operations desk", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-australia-trades-course/);
  assert.match(page, /A lead-to-review trades operations desk/);
  assert.match(page, /Enquiry \+ safety triage queue/);
  assert.match(page, /Dispatch \+ return-visit board/);
  assert.match(page, /Quote \+ variation \+ supplier control/);
  assert.match(page, /Invoice \+ Xero\/MYOB handoff/);
});

test("Australia fundamentals and trades use applied-scenario learner modes", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /hasAppliedScenario/);
  assert.match(page, /training-work-player training-australia-fundamentals-player/);
  assert.match(page, /training-work-player training-australia-trades-player/);
  assert.match(page, /Applied Australia scenario/);
  assert.match(page, /Trades ops scenario/);

  assert.match(css, /Australia fundamentals \+ trades palettes/);
  assert.match(css, /\.training-australia-fundamentals-course,[\s\S]*\.training-australia-fundamentals-player/);
  assert.match(css, /\.training-australia-trades-course,[\s\S]*\.training-australia-trades-player/);
});

test("the learner badges reflect real scenario-based lessons rather than invented exercises", async () => {
  const fundamentals = await read("supabase/migrations/20260924090500_refresh_australian_va_fundamentals.sql");
  const trades = await read("supabase/migrations/20260924083500_refresh_australian_trades_administration.sql");

  assert.ok((fundamentals.match(/"type":"scenario"/g) || []).length >= 8);
  assert.ok((trades.match(/"type":"scenario"/g) || []).length >= 8);
  assert.doesNotMatch(fundamentals, /"type":"exercise"/);
  assert.doesNotMatch(trades, /"type":"exercise"/);
});

test("the pair keeps decision, safety, and specialist boundaries visible", async () => {
  const fundamentals = await read("supabase/migrations/20260924090500_refresh_australian_va_fundamentals.sql");
  const trades = await read("supabase/migrations/20260924083500_refresh_australian_trades_administration.sql");

  assert.match(fundamentals, /Own the workflow, not every decision/i);
  assert.match(fundamentals, /Minimum necessary is a workflow habit/i);
  assert.match(fundamentals, /A handoff is not a diary/i);

  assert.match(trades, /Escalate risk, do not diagnose it/i);
  assert.match(trades, /Capability before availability/i);
  assert.match(trades, /Do not negotiate by accident/i);
  assert.match(trades, /Review request is not review manipulation/i);
});

test("both courses keep their practical final presented as a work simulation", async () => {
  const seed = await read("supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(seed, /Australian VA Fundamentals Final Work Simulation/);
  assert.match(seed, /Australian Trades Administration Final Work Simulation/);
  assert.match(seed, /'practical'/);
  assert.match(page, /Practical work simulation/);
});
