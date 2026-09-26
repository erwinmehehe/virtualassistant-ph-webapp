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
  const [page, css, leadStyles] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/recruiter-mobile.css"),
    read("src/app/workspace/recruiter/leads/leads.module.css"),
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
  assert.match(leadStyles, /\.crmPage :global\(\.crm-role-bridge\)/);
  assert.ok(page.indexOf("crm-role-bridge") < page.indexOf("crm-secondary-controls"), "role action should render before secondary CRM controls");
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


test("recruiter role matching renders as viewport-safe candidate cards on phones", async () => {
  const [css, table] = await Promise.all([
    read("src/app/workspace/recruiter/recruiter-mobile.css"),
    read("src/components/matching-candidate-table.tsx"),
  ]);

  assert.match(table, /className="table-wrap responsive-table matching-table"/);
  assert.match(table, /data-label="Availability"/);
  assert.match(table, /data-label="Client recommendation"/);
  assert.match(css, /\.workspace-role-recruiter \.responsive-table table,[\s\S]*min-width: 0 !important/);
  assert.match(css, /\.workspace-role-recruiter \.matching-table tbody tr[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /td\[data-label="Client recommendation"\][\s\S]*grid-column: 1 \/ -1/);
  assert.match(css, /\.workspace-role-recruiter \.matching-table textarea[\s\S]*min-height: 96px/);
  assert.match(css, /padding-bottom: calc\(128px \+ env\(safe-area-inset-bottom\)\)/);
});

test("recruiter mobile shell prevents dashboard-wide horizontal page overflow", async () => {
  const css = await read("src/app/workspace/recruiter/recruiter-mobile.css");

  assert.match(css, /\.workspace-role-recruiter \.app-main,[\s\S]*overflow-x: clip/);
  assert.match(css, /\.workspace-role-recruiter \.app-content > \*/);
  assert.match(css, /\.workspace-role-recruiter \.table-wrap:not\(\.responsive-table\)[\s\S]*overflow-x: auto/);
  assert.match(css, /\.workspace-role-recruiter \.role-workflow-nav[\s\S]*overflow-x: auto/);
});
