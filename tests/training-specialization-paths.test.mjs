import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const pagePath = "src/app/workspace/training/page.tsx";
const migrationPath = "supabase/migrations/20260923211800_strengthen_australian_tradie_simulation.sql";

test("signed-in training adds four Australian specialization routes without creating public course URLs", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /Choose one specialisation/);
  assert.match(page, /Tradie & home-service operations/);
  assert.match(page, /Property management administration/);
  assert.match(page, /NDIS & allied health administration/);
  assert.match(page, /Mortgage broking administration/);

  assert.match(page, /australian-trades-administration/);
  assert.match(page, /servicem8-for-virtual-assistants/);
  assert.match(page, /property-management-administration-australia/);
  assert.match(page, /ndis-administration-fundamentals/);
  assert.match(page, /mortgage-broking-administration-australia/);

  assert.doesNotMatch(page, /href=\{?\`\/training\/courses/);
  assert.match(page, /\/workspace\/training\/courses/);
});

test("specialization chooser only acts on published courses and uses real learner states", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /courses\.find\(\(course\) => course\.slug === slug\)/);
  assert.match(page, /published\.length === specialization\.courses\.length/);
  assert.match(page, /startTrainingCourseAction/);
  assert.match(page, /Not started/);
  assert.match(page, /In progress/);
  assert.match(page, /Completed/);
  assert.match(page, /Start path/);
  assert.match(page, /Continue path/);
});

test("tradie capstone covers the full enquiry-to-review lifecycle", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const required of [
    "Enquiry:",
    "Qualification and triage:",
    "Booking and dispatch:",
    "Quote:",
    "Quote follow-up:",
    "Job delivery:",
    "Invoice and payment:",
    "Review request:",
    "Handoff:",
  ]) {
    assert.ok(sql.includes(required), "Missing workflow stage: " + required);
  }

  assert.match(sql, /honest customer review/i);
  assert.match(sql, /Do not request a review while a complaint, safety concern, return visit, or unresolved service issue/i);
  assert.match(sql, /Never invent reviews/i);
  assert.match(sql, /pass_score = 80/);
});

test("tradie capstone migration strengthens draft content without publishing it", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where slug = 'australian-trades-administration'/);
  assert.match(sql, /where slug = 'australian-trades-composite-work-simulation'/);
  assert.doesNotMatch(sql, /status\s*=\s*'published'/i);
  assert.doesNotMatch(sql, /is_published\s*=\s*true/i);
  assert.doesNotMatch(sql, /published_at\s*=\s*now/i);
});
