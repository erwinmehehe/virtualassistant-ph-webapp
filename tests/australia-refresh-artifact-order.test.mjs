import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const restorePath = "supabase/migrations/20260925113800_restore_australia_fundamentals_trades_artifacts_after_refresh.sql";
const fundamentalsPath = "supabase/migrations/20260924090500_refresh_australian_va_fundamentals.sql";

test("Australian Fundamentals refresh respects the database 30-minute lesson cap", async () => {
  const sql = await readFile(fundamentalsPath, "utf8");

  assert.match(sql, /estimated_minutes = 210/);
  assert.equal((sql.match(/estimated_minutes = 25/g) || []).length, 6);
  assert.equal((sql.match(/estimated_minutes = 30/g) || []).length, 2);
  assert.doesNotMatch(sql, /estimated_minutes = (3[1-9]|[4-9]\d)/);
});

test("post-refresh migration recreates work artifacts instead of only relabeling old blocks", async () => {
  const sql = await readFile(restorePath, "utf8");

  assert.match(sql, /not in \('exercise','template','checklist'\)/);
  assert.match(sql, /jsonb_build_object\(\s*'type','exercise'/);
  assert.match(sql, /jsonb_build_object\('type','template'/);
  assert.match(sql, /jsonb_build_object\('type','checklist'/);
  assert.match(sql, /Build the lesson work product/);
  assert.match(sql, /decision-ready record another team member can continue/);
});

test("artifact restore covers every lesson in both refreshed Australia courses", async () => {
  const sql = await readFile(restorePath, "utf8");

  for (const slug of [
    "how-australian-small-businesses-work-with-vas",
    "australian-business-language-dates-and-communication",
    "australian-time-zones-daylight-saving-and-scheduling",
    "australian-privacy-personal-information-and-offshore-va-access",
    "abn-gst-bas-invoices-and-finance-terminology-for-vas",
    "australian-customer-service-and-administrative-follow-up",
    "daily-handoffs-between-the-philippines-and-australia",
    "australian-va-composite-work-simulation",
    "from-customer-enquiry-to-completed-job",
    "emergency-urgent-and-routine-job-triage",
    "scheduling-technicians-travel-and-job-windows",
    "quote-administration-and-follow-up",
    "customer-updates-delays-and-job-completion",
    "supplier-parts-and-purchase-administration",
    "invoicing-payment-follow-up-and-accounting-handoff",
    "australian-trades-composite-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing artifact spec for " + slug);
  }
});

test("worked examples are restored only after exercise blocks exist", async () => {
  const sql = await readFile(restorePath, "utf8");
  const rebuildIndex = sql.indexOf("Build the lesson work product");
  const examplesIndex = sql.indexOf("with worked_examples");

  assert.ok(rebuildIndex >= 0);
  assert.ok(examplesIndex > rebuildIndex);
  assert.match(sql, /where b2\.block->>'type'='exercise'/);
});
