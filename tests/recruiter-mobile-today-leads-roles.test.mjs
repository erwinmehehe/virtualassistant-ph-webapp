import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter My Day stays compact and thumb-safe on mobile", async () => {
  const [page, css, layout] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/recruiter-mobile.css"),
    read("src/app/workspace/recruiter/layout.tsx"),
  ]);

  assert.match(layout, /recruiter-mobile\.css/);
  assert.match(page, /recruiter-today-page/);
  assert.match(css, /Recruiter mobile pass: My Day, Leads, Roles/);
  assert.match(css, /\.recruiter-today-page \.dash-header-actions[\s\S]*repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.recruiter-today-page \.dashboard-section-card input,[\s\S]*font-size: 16px/);
});

test("recruiter leads uses mobile metrics, tabs, filters, and lead cards", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/recruiter-mobile.css"),
  ]);

  for (const className of [
    "recruiter-leads-page",
    "recruiter-leads-head",
    "recruiter-leads-metrics",
    "recruiter-leads-tabs",
    "recruiter-leads-filters",
    "recruiter-leads-list",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.recruiter-leads-metrics[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.recruiter-leads-tabs[\s\S]*overflow-x: auto/);
  assert.match(css, /\.recruiter-leads-filters input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.recruiter-leads-list \.crm-lead-body[\s\S]*grid-template-columns: 1fr/);
});

test("recruiter roles uses compact stats, scrollable saved views, and mobile role cards", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/app/workspace/recruiter/recruiter-mobile.css"),
  ]);

  for (const className of [
    "recruiter-roles-page",
    "recruiter-roles-head",
    "recruiter-role-stats",
    "recruiter-role-pipeline",
    "recruiter-role-card",
    "recruiter-role-coverage",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.recruiter-role-stats[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.saved-view-list[\s\S]*overflow-x: auto/);
  assert.match(css, /\.recruiter-role-pipeline \.role-sort-form select[\s\S]*font-size: 16px/);
  assert.match(css, /\.recruiter-role-card > \.row-between[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});
