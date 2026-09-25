import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client onboarding becomes a compact phone flow", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/onboarding/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-onboarding-page",
    "client-onboarding-hero",
    "client-onboarding-form",
    "client-onboarding-step",
    "client-onboarding-budget-grid",
    "client-onboarding-finish",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /Client mobile pass: onboarding, My Team, workroom/);
  assert.match(css, /\.client-onboarding-step input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-onboarding-finish \.btn[\s\S]*min-height: 46px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-onboarding-budget-grid[\s\S]*grid-template-columns: 1fr/);
});

test("My Team makes placement health and check-ins tappable on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/team/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-team-page",
    "client-team-card",
    "client-team-facts",
    "client-team-checkin",
    "client-team-checkin-actions",
    "client-team-actions",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.client-team-facts[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-team-checkin-actions[\s\S]*grid-template-columns: repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-team-checkin textarea[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-team-actions \.btn[\s\S]*min-height: 44px/);
});

test("client workroom converts tasks and time review into a mobile-first flow", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/workroom/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-workroom-page",
    "client-workroom-card",
    "client-workroom-terms",
    "client-workroom-main-grid",
    "client-workroom-task-form",
    "client-workroom-task-table",
    "client-workroom-time-table",
    "client-workroom-time-review-panel",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.client-workroom-main-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-workroom-task-table thead,[\s\S]*display: none/);
  assert.match(css, /\.client-workroom-task-status select[\s\S]*font-size: 16px/);
  assert.match(css, /\.client-workroom-time-review-panel textarea[\s\S]*font-size: 16px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-workroom-stats[\s\S]*grid-template-columns: 1fr/);
});
