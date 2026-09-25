import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA profile keeps phone editing compact and iOS friendly", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/profile/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-profile-mobile-head/);
  assert.match(page, /va-profile-preview/);
  assert.match(css, /VA mobile next-three pass: profile, placement, interviews/);
  assert.match(css, /profile-editor-form \.field input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\)[\s\S]*font-size: 16px/);
  assert.match(css, /profile-editor-form \.field textarea[\s\S]*min-height: 118px/);
});

test("VA placement workspace has dedicated mobile surfaces", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/workroom/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  for (const className of [
    "va-workroom-page",
    "va-workroom-card",
    "va-workroom-summary",
    "va-workroom-support",
    "va-workroom-terms",
    "va-workroom-checkin",
    "va-workroom-stats",
    "va-workroom-main-grid",
    "va-workroom-tasks",
  ]) {
    assert.match(page, new RegExp(className));
  }

  assert.match(css, /\.va-workroom-summary[\s\S]*flex-direction: column/);
  assert.match(css, /\.va-workroom-terms \.grid-4[\s\S]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.va-workroom-checkin > \.row\.wrap[\s\S]*grid-template-columns: 1fr/);
  assert.match(css, /\.va-workroom-tasks \.responsive-table td form\.row[\s\S]*flex-direction: column/);
});

test("VA interviews expose full-width mobile meeting actions", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/va/interviews/page.tsx"),
    read("src/app/workspace/va/va-workspace.css"),
  ]);

  assert.match(page, /va-interviews-page/);
  assert.match(page, /va-interview-card/);
  assert.match(page, /va-interview-join/);
  assert.match(page, /va-interview-schedule/);
  assert.match(css, /\.va-interview-summary[\s\S]*flex-direction: column/);
  assert.match(css, /\.va-interview-join[\s\S]*width: 100%/);
  assert.match(css, /\.va-interview-schedule form \.btn[\s\S]*width: 100%/);
});
