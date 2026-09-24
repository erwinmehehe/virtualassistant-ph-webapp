import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const capstonePath =
  "supabase/migrations/20260924124000_connect_sales_ecommerce_capstones.sql";
const workedPath =
  "supabase/migrations/20260924124500_add_sales_ecommerce_worked_examples.sql";

test("Sales capstone is one connected Harborline work portfolio", async () => {
  const sql = await readFile(capstonePath, "utf8");

  for (const phrase of [
    "Harborline Growth Partners",
    "ICP and funnel-stage matrix",
    "Prospect data-quality audit",
    "CRM dedupe/enrichment plan",
    "outreach personalisation briefs",
    "Reply-triage and sequence-control board",
    "Qualification/discovery handoff",
    "Appointment-setting and no-show recovery record",
    "CRM stage/owner/task correction log",
    "Sensitive-reply escalation record",
    "Funnel and data-quality report",
  ]) {
    assert.ok(
      sql.toLowerCase().includes(phrase.toLowerCase()),
      "Missing Sales capstone element: " + phrase,
    );
  }

  for (const resource of [
    "Harborline ICP and funnel rules",
    "Prospect research and data-quality sample",
    "CRM duplicate and stage extract",
    "Live outreach reply queue",
    "Qualification and booking notes",
    "Approved outreach claims and boundaries",
    "Weekly sales-support funnel extract",
    "Harborline sales-support rules",
  ]) {
    assert.ok(sql.includes(resource), "Missing Sales capstone resource: " + resource);
  }
});

test("E-commerce capstone is one connected Marlow Home operations portfolio", async () => {
  const sql = await readFile(capstonePath, "utf8");

  for (const phrase of [
    "Marlow Home",
    "Product/SKU source record",
    "Product-page QA sheet",
    "Bulk catalog change plan",
    "Prioritized order-exception queue",
    "Delivered-not-received investigation record",
    "Return/refund decision sheet",
    "Omnichannel customer-case record",
    "Inventory discrepancy report",
    "Promotion launch QA",
    "Marketplace/store operations handoff",
  ]) {
    assert.ok(
      sql.toLowerCase().includes(phrase.toLowerCase()),
      "Missing E-commerce capstone element: " + phrase,
    );
  }

  for (const resource of [
    "Marlow Home store systems and authority",
    "Catalog and listing QA extract",
    "Order exception queue",
    "Customer and support history",
    "Inventory and warehouse evidence",
    "Weekend promotion brief and QA cases",
    "Store exception policy",
    "Daily store operations metrics",
  ]) {
    assert.ok(sql.includes(resource), "Missing E-commerce resource: " + resource);
  }
});

test("worked examples cover the hardest Sales judgment tasks", async () => {
  const sql = await readFile(workedPath, "utf8");

  for (const slug of [
    "ethical-lead-research-and-data-quality",
    "deduplication-enrichment-and-crm-hygiene",
    "sequences-follow-ups-and-reply-triage",
    "qualification-support-and-discovery-boundaries",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing Sales worked example: " + slug);
  }

  for (const phrase of [
    "available data is not automatically usable data",
    "newest does not always mean authoritative",
    "an opt-out is an action, not a debate",
    "interest is not complete qualification",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Sales modelling concept: " + phrase);
  }
});

test("worked examples cover the hardest E-commerce judgment tasks", async () => {
  const sql = await readFile(workedPath, "utf8");

  for (const slug of [
    "products-variants-skus-and-source-data",
    "shipping-tracking-and-fulfilment-communication",
    "inventory-monitoring-and-reorder-administration",
    "promotions-discount-codes-and-launch-checklists",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing E-commerce worked example: " + slug);
  }

  for (const phrase of [
    "fix identity before fixing the listing",
    "delivered does not end the investigation",
    "preserve the discrepancy",
    "a broken eligibility rule is a no-go",
  ]) {
    assert.ok(sql.includes(phrase), "Missing E-commerce modelling concept: " + phrase);
  }
});

test("expert examples appear before the learner exercise and remain idempotent", async () => {
  const sql = await readFile(workedPath, "utf8");

  assert.match(sql, /where b2\.block->>'type' = 'exercise'/);
  assert.match(sql, /b\.ord < ex\.exercise_ord/);
  assert.match(sql, /b\.ord >= ex\.exercise_ord/);
  assert.match(sql, /existing->>'title' = t\.example_title/);
});

test("follow-up migrations preserve lessons and learner progress", async () => {
  for (const path of [capstonePath, workedPath]) {
    const sql = await readFile(path, "utf8");
    assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
    assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(sql, /insert into public\.training_courses/i);
  }
});
