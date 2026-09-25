import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA dashboard keeps status and pipeline compact on phones", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-dashboard-head/);
  assert.match(page, /va-dashboard-pipeline/);
  assert.match(css, /VA mobile pass: dashboard, jobs, vetting/);
  assert.match(css, /\.va-overview \.va-status-strip[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-overview \.pipeline-summary[\s\S]*grid-template-columns: repeat\(5, minmax\(92px, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 420px\)[\s\S]*\.va-overview \.va-status-strip[\s\S]*grid-template-columns: 1fr/);
});

test("VA jobs use a denser mobile browse layout", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/jobs/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-jobs-mobile-head/);
  assert.match(page, /va-job-mobile-card/);
  assert.match(page, /va-job-mobile-actions/);
  assert.match(css, /\.va-job-meta[\s\S]*display: grid/);
  assert.match(css, /\.va-job-mobile-actions[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(92px, \.55fr\)/);
  assert.match(css, /\.va-job-mobile-actions \.btn[\s\S]*min-height: 44px/);
});

test("VA vetting has a responsive dedicated screening layout", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/vetting/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  for (const className of [
    "va-vetting-page",
    "va-vetting-stats",
    "va-vetting-layout",
    "va-vetting-progress-card",
    "va-vetting-skills-card",
    "va-vetting-video-card",
    "va-vetting-sidebar",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.va-vetting-layout[\s\S]*grid-template-columns: minmax\(0, 1fr\) minmax\(220px, 280px\)/);
  assert.match(css, /@media \(max-width: 680px\)[\s\S]*\.va-vetting-stats[\s\S]*grid-template-columns: repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-vetting-test-form textarea,[\s\S]*font-size: 16px/);
  assert.match(css, /\.va-vetting-video-form[\s\S]*grid-template-columns: 1fr/);
});
