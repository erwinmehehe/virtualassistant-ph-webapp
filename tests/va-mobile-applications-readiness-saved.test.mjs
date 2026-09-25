import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA applications mobile layout keeps actions tappable and compact", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/applications/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-applications-page/);
  assert.match(page, /va-request-actions/);
  assert.match(page, /va-application-actions/);
  assert.match(css, /VA mobile pass: applications, work readiness, saved jobs/);
  assert.match(css, /\.va-request-actions,[\s\S]*\.va-application-actions[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-request-actions \.btn,[\s\S]*min-height: 42px/);
});

test("VA work readiness has a real responsive layout", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/work-readiness/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-work-readiness-page/);
  assert.match(page, /va-readiness-layout/);
  assert.match(page, /va-readiness-summary/);
  assert.match(page, /va-readiness-form-card/);
  assert.match(css, /\.va-readiness-layout[\s\S]*grid-template-columns: minmax\(240px, 300px\) minmax\(0, 1fr\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-readiness-fields[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.va-readiness-fields input,[\s\S]*font-size: 16px/);
  assert.match(css, /\.va-readiness-actions \.btn[\s\S]*min-height: 46px/);
});

test("VA saved jobs stack metadata and actions cleanly on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/saved/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-saved-page/);
  assert.match(page, /va-saved-row/);
  assert.match(page, /va-job-meta/);
  assert.match(css, /\.va-saved-row \.va-job-meta[\s\S]*display: grid/);
  assert.match(css, /\.va-saved-row \.va-job-actions[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.va-saved-row \.va-job-actions[\s\S]*grid-template-columns: 1fr/);
});
