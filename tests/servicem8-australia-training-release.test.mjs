import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("ServiceM8 course release is reviewer-gated and assessment-gated", async () => {
  const sql = await readFile(
    "supabase/migrations/20260923215000_release_servicem8_va_training.sql",
    "utf8",
  );

  assert.match(sql, /servicem8-for-virtual-assistants/);
  assert.match(sql, /is_published = true/);
  assert.match(sql, /reviewed_by = 'VirtualAssistant\.com\.ph Editorial Team'/);
  assert.match(sql, /last_reviewed_at = now\(\)/);
  assert.match(sql, /pass_score = 80/);
  assert.match(sql, /status = 'published'/);
  assert.match(sql, /content_version = greatest\(content_version, 2\)/);
});

test("the Australian tradie path now has reviewed release migrations for fundamentals, trades, and ServiceM8", async () => {
  const releases = [
    ["supabase/migrations/20260923145500_release_australian_va_fundamentals.sql", "australian-va-fundamentals"],
    ["supabase/migrations/20260923150000_release_australian_trades_administration.sql", "australian-trades-administration"],
    ["supabase/migrations/20260923215000_release_servicem8_va_training.sql", "servicem8-for-virtual-assistants"],
  ];

  for (const [path, slug] of releases) {
    const sql = await readFile(path, "utf8");
    assert.match(sql, new RegExp(slug));
    assert.match(sql, /status = 'published'/);
    assert.match(sql, /pass_score = 80/);
  }
});

test("ServiceM8 source curriculum contains eight practical lessons and a final simulation", async () => {
  const seed = await readFile(
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "utf8",
  );

  const courseStart = seed.indexOf("'servicem8-for-virtual-assistants'");
  assert.ok(courseStart >= 0);
  const segment = seed.slice(courseStart);

  assert.equal((segment.match(/insert into public\.training_lessons/g) || []).length, 8);
  assert.equal((segment.match(/"type":"scenario"/g) || []).length, 8);
  assert.equal((segment.match(/insert into public\.training_assessments/g) || []).length, 1);
  assert.match(segment, /ServiceM8 Composite VA Simulation/);
});

test("ServiceM8 content keeps product-currency, trademark, and authority safeguards", async () => {
  const seed = await readFile(
    "supabase/migrations/20260923061000_build_australia_va_trades_servicem8.sql",
    "utf8",
  );
  const courseStart = seed.indexOf("'servicem8-for-virtual-assistants'");
  const segment = seed.slice(courseStart);

  assert.match(segment, /not affiliated with, certified by, or endorsed by ServiceM8/i);
  assert.match(segment, /verify the current workflow against official ServiceM8 help documentation/i);
  assert.match(segment, /first call through scheduling, quoting, completion, invoicing, and payment/i);
  assert.match(segment, /online acceptance/i);
  assert.match(segment, /accounting integrations/i);
  assert.match(segment, /automation/i);
  assert.match(segment, /Do not make technical, pricing, tax, payment-write-off, or safety decisions/i);
});

test("ServiceM8 release remains private-LMS only and does not create a public course route", async () => {
  const publicTraining = await readFile("src/app/training/page.tsx", "utf8");
  const dashboard = await readFile("src/app/workspace/training/page.tsx", "utf8");
  const specializations = await readFile("src/lib/training-specializations.ts", "utf8");

  assert.doesNotMatch(publicTraining, /href=\{?\`?\/training\/courses/);
  assert.match(publicTraining, /Lessons stay inside your free training account/);
  assert.match(specializations, /servicem8-for-virtual-assistants/);
  assert.match(dashboard, /Choose one specialisation/);
});
