import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("Bookkeeping overview foregrounds finance-control work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-bookkeeping-course/);
  assert.match(page, /A finance-admin control pack/);
  assert.match(page, /Source documents \+ coding queries/);
  assert.match(page, /AP \+ payment control queue/);
  assert.match(page, /AR \+ reconciliation exceptions/);
  assert.match(page, /Month-end \+ finance handoff/);
});

test("Payroll overview foregrounds payroll-control work outputs", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(page, /training-payroll-course/);
  assert.match(page, /A payroll control pack/);
  assert.match(page, /Timesheet \+ cutoff exception queue/);
  assert.match(page, /Employee change register/);
  assert.match(page, /Pre-payroll variance \+ approval pack/);
  assert.match(page, /Post-payroll \+ query handoff/);
});

test("Bookkeeping and Payroll reuse the shared practical work lesson treatment", async () => {
  const page = await read("src/app/workspace/training/courses/[slug]/lessons/[lessonId]/page.tsx");
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(page, /training-work-player training-bookkeeping-player/);
  assert.match(page, /training-work-player training-payroll-player/);
  assert.match(page, /Finance control artifact included/);
  assert.match(page, /Payroll control artifact included/);
  assert.match(css, /Finance controls \+ training mobile cleanup/);
  assert.match(css, /\.training-bookkeeping-course,[\s\S]*\.training-bookkeeping-player/);
  assert.match(css, /\.training-payroll-course,[\s\S]*\.training-payroll-player/);
});

test("mobile recommended path no longer squeezes and truncates course steps", async () => {
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(css, /\.training-path-steps li > span:last-child\s*\{\s*min-width: 0;/);
  assert.match(css, /\.training-path-steps strong[\s\S]*white-space: normal;[\s\S]*-webkit-line-clamp: 2;/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.training-path-steps\s*\{\s*grid-template-columns: minmax\(0, 1fr\);/);
  assert.match(css, /@media \(max-width: 640px\)[\s\S]*\.training-path-next[\s\S]*flex-direction: column;/);
});

test("lesson duration chips have a visible colored treatment", async () => {
  const css = await read("src/app/workspace/training/training-home.css");

  assert.match(css, /\.training-course-page \.training-lesson-meta[\s\S]*border: 1px solid #bae6fd;/);
  assert.match(css, /\.training-course-page \.training-lesson-meta[\s\S]*background: #f0f9ff;/);
  assert.match(css, /\.training-course-page \.training-lesson-meta[\s\S]*color: #0369a1;/);
  assert.match(css, /\.training-lesson-row\.is-next \.training-lesson-meta[\s\S]*background: #eef2ff;/);
  assert.match(css, /\.training-lesson-row\.is-complete:not\(\.is-next\) \.training-lesson-meta[\s\S]*background: #ecfdf3;/);
});

test("Bookkeeping and Payroll remain practical control simulations", async () => {
  const bookkeeping = await read("supabase/migrations/20260923122500_write_bookkeeping_administration_va_training.sql");
  const payroll = await read("supabase/migrations/20260923133000_write_payroll_va_training.sql");
  const page = await read("src/app/workspace/training/courses/[slug]/page.tsx");

  assert.match(bookkeeping, /Cedar Lane Services/);
  assert.match(bookkeeping, /administrative control and work output rather than bookkeeping trivia/i);
  assert.match(payroll, /Harbor & Field Services/);
  assert.match(payroll, /missing approvals and sensitive data safely/i);
  assert.match(page, /Practical work simulation/);
});
