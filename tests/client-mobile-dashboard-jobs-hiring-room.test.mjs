import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("client dashboard is compact and decision-first on phones", async () => {
  const [page, css, layout] = await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
    read("src/app/workspace/client/layout.tsx"),
  ]);

  assert.match(layout, /client-mobile\.css/);
  assert.match(page, /client-mobile-dashboard/);
  assert.match(page, /client-mobile-workflow/);
  assert.match(page, /client-mobile-attention/);
  assert.match(page, /client-mobile-pipeline/);
  assert.match(css, /Client workspace mobile completion pass/);
  assert.match(css, /\.client-mobile-workflow \.workflow-steps[\s\S]*grid-auto-columns: minmax\(116px, 1fr\)/);
  assert.match(css, /\.client-mobile-after-onboarding[\s\S]*grid-template-columns: 1fr/);
});

test("client hiring requests become readable cards on mobile", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/jobs/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  assert.match(page, /client-jobs-page/);
  assert.match(page, /client-jobs-table/);
  assert.match(page, /client-job-row/);
  assert.match(page, /client-job-progress/);
  assert.match(css, /\.client-jobs-table thead[\s\S]*display: none/);
  assert.match(css, /\.client-jobs-table \.client-job-row[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-job-progress[\s\S]*min-height: 42px/);
});

test("client Hiring Room stacks shortlist cards and actions safely", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/client/candidates/page.tsx"),
    read("src/app/workspace/client/client-mobile.css"),
  ]);

  for (const className of [
    "client-hiring-room",
    "client-hiring-next-action",
    "client-hiring-role-tabs",
    "client-shortlist-section",
    "client-shortlist-grid",
    "client-shortlist-action-grid",
    "client-shortlist-decision-form",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.client-shortlist-grid[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.client-shortlist-action-grid[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.client-shortlist-decision-form select,[\s\S]*font-size: 16px/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.client-shortlist-action-grid[\s\S]*grid-template-columns: 1fr/);
});
