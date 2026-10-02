import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pathPage = "src/app/workspace/training/paths/[slug]/page.tsx";
const homePage = "src/app/workspace/training/page.tsx";
const specializations = "src/lib/training-specializations.ts";
const cssPath = "src/app/workspace/training/training-home.css";

test("Australian specialisations have dedicated learner path pages with outcomes and ordered course states", async () => {
  const [page, config] = await Promise.all([
    readFile(pathPage, "utf8"),
    readFile(specializations, "utf8"),
  ]);

  assert.match(page, /getAustraliaSpecialization\(slug\)/);
  assert.match(page, /getTrainingDashboard\(userId\)/);
  assert.match(page, /training-path-detail-hero/);
  assert.match(page, /training-path-outcome-grid/);
  assert.match(page, /training-path-detail-steps/);
  assert.match(page, /Follow the path in order/);
  assert.match(page, /Shared foundation/);
  assert.match(page, /Complete the earlier step first/);
  assert.match(page, /Choose path and start/);
  assert.match(page, /selectAustraliaSpecializationAction/);
  assert.match(page, /startTrainingCourseAction/);

  for (const slug of ["tradie-operations", "property-management", "ndis-allied-health", "mortgage-broking"]) {
    assert.match(config, new RegExp(`slug: "${slug}"`));
  }
  assert.equal((config.match(/outcomes: \[/g) || []).length, 4);
});

test("training home exposes a path-details action without removing start and continue actions", async () => {
  const page = await readFile(homePage, "utf8");

  assert.match(page, /\/workspace\/training\/paths\/\$\{specialization\.slug\}/);
  assert.match(page, />\s*View path\s*</);
  assert.match(page, /Start path/);
  assert.match(page, /Continue path/);
  assert.match(page, /Switch path/);
});

test("learning path detail UI uses compact responsive sequencing", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\/\* Learning path detail pages \*\//);
  assert.match(css, /\.training-path-detail-hero-grid/);
  assert.match(css, /\.training-path-outcome-grid/);
  assert.match(css, /\.training-path-detail-step/);
  assert.match(css, /\.training-path-detail-course-state\.is-complete/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.training-path-detail-actions/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.training-path-detail-step/);
});
