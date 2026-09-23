import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923110000_write_ecommerce_va_training.sql";

test("E-commerce VA course is fully written but remains draft", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /where slug = 'ecommerce-virtual-assistant'/);
  assert.match(sql, /set estimated_minutes = 360/);
  assert.match(sql, /status = 'draft'/);
  assert.match(sql, /published_at = null/);
  assert.match(sql, /is_published = false/);
  assert.match(sql, /reviewed_by = null/);
  assert.match(sql, /last_reviewed_at = null/);
});

test("E-commerce VA has twelve detailed thirty-minute lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.equal((sql.match(/update public\.training_lessons l/g) || []).length, 12);
  assert.equal((sql.match(/estimated_minutes = 30/g) || []).length, 12);

  for (const slug of [
    "how-an-online-store-operates",
    "products-variants-skus-and-source-data",
    "product-listing-and-content-qa",
    "bulk-updates-collections-and-merchandising-support",
    "order-processing-and-exception-tracking",
    "shipping-tracking-and-fulfilment-communication",
    "returns-refunds-exchanges-and-policy-based-support",
    "customer-service-across-email-chat-and-marketplaces",
    "inventory-monitoring-and-reorder-administration",
    "promotions-discount-codes-and-launch-checklists",
    "store-reporting-and-marketplace-handoffs",
    "composite-e-commerce-va-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing E-commerce VA lesson: " + slug);
  }
});

test("E-commerce VA content uses supported blocks and operational controls", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /"type":"scenario"/);
  assert.match(sql, /"type":"callout"/);
  assert.match(sql, /"type":"steps"/);
  assert.match(sql, /"type":"list"/);
  assert.match(sql, /"type":"paragraph"/);
  assert.doesNotMatch(sql, /"type":"text"/);
  assert.match(sql, /One action may affect several systems/i);
  assert.match(sql, /Never infer product facts from the image/i);
  assert.match(sql, /A risk flag is not permission to accuse the customer/i);
  assert.match(sql, /Never change stock just to make the storefront look right/i);
  assert.match(sql, /A code that works is not enough/i);
  assert.match(sql, /Final practice: run an e-commerce operations day/i);
});

test("E-commerce VA final assessment tests real store operations", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /prioritized operations queue/i);
  assert.match(sql, /duplicate-SKU correction note/i);
  assert.match(sql, /delivered-not-received investigation record/i);
  assert.match(sql, /inventory discrepancy report/i);
  assert.match(sql, /promotion QA stop-launch note/i);
  assert.match(sql, /marketplace inventory-sync handoff/i);
  assert.match(sql, /assessment_type = 'practical'/);
  assert.match(sql, /pass_score = null/);
  assert.match(sql, /is_published = false/);
});
