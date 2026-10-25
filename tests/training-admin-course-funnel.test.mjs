import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("retired first-party conversion dashboard redirects instead of scanning analytics tables", async () => {
  const page = await read("src/app/workspace/admin/analytics/page.tsx");
  const nav = await read("src/components/app-nav-links.tsx");

  assert.match(page, /redirect\("\/workspace\/admin\/today"\)/);
  assert.doesNotMatch(page, /analytics_events|admin_analytics_summary|training_enrollments/);
  assert.doesNotMatch(nav, /\["Analytics", "\/workspace\/admin\/analytics"/);
  assert.doesNotMatch(nav, /mobilePrimary:[\s\S]*"\/workspace\/admin\/analytics"/);
});

test("essential training reports use saved course and learner data instead", async () => {
  const [page, lib, activation, layout] = await Promise.all([
    read("src/app/workspace/admin/training/page.tsx"),
    read("src/lib/training.ts"),
    read("src/app/workspace/admin/training/activation/page.tsx"),
    read("src/app/workspace/admin/layout.tsx")
  ]);

  assert.match(layout, /requireRoleFast\("admin"\)/);
  assert.match(page, /Completion within 7 and 14 days/);
  assert.match(page, /Course-level completion bottlenecks/);
  assert.match(page, /Learner integrity signals/);
  assert.match(activation, /Training account activation/);
  for (const table of ["training_enrollments", "training_lesson_progress", "training_assessment_submissions"]) {
    assert.match(lib, new RegExp('from\\("' + table + '"\\)'), "Saved training table must remain");
  }
  assert.match(lib, /buildTrainingCohortConversion/);
  assert.match(lib, /buildTrainingCompletionHealth/);
  assert.doesNotMatch(page, /Learner completion funnel|stage\.events|Checkpoint failure/);
  assert.doesNotMatch(lib, /\.from\("analytics_events"\)/);
});
