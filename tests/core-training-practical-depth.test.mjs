import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924102000_core_training_practical_depth.sql";
const executivePath = "supabase/migrations/20260924101000_executive_va_practical_lesson_work.sql";
const earlierDepthPath = "supabase/migrations/20260923235000_deepen_thin_core_training_courses.sql";

const marketingLessons = [
  "how-marketing-work-moves-from-brief-to-campaign",
  "brand-claims-approvals-and-source-of-truth",
  "content-calendars-briefs-and-production-tracking",
  "asset-coordination-and-quality-assurance",
  "email-campaign-administration",
  "crm-segments-tags-and-campaign-data-hygiene",
  "campaign-launch-checklists-and-cross-channel-coordination",
  "community-lead-and-response-routing",
  "marketing-reporting-and-basic-performance-interpretation",
  "responsible-ai-in-marketing-operations",
  "agency-and-in-house-handoffs",
  "composite-marketing-va-work-simulation",
];

const supportLessons = [
  "customer-support-channels-roles-and-outcomes",
  "tone-empathy-accuracy-and-ownership",
  "ticket-triage-priority-and-routing",
  "notes-tags-statuses-and-handoffs",
  "using-a-knowledge-base-without-copy-paste-support",
  "troubleshooting-boundaries-and-escalation",
  "refunds-credits-cancellations-and-policy-boundaries",
  "complaints-angry-customers-and-de-escalation",
  "sla-response-time-resolution-and-backlog",
  "quality-assurance-and-support-coaching-notes",
  "crm-and-cross-team-handoffs",
  "composite-customer-support-simulation",
];

const ecommerceLessons = [
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
];

test("the weakest remaining core courses get practical work in every lesson", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [...marketingLessons, ...supportLessons, ...ecommerceLessons]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing practical lesson: " + slug);
  }

  assert.equal(marketingLessons.length, 12);
  assert.equal(supportLessons.length, 12);
  assert.equal(ecommerceLessons.length, 12);
});

test("Marketing, Customer Support, and E-commerce use first-class exercise template and QA blocks", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /'type', 'exercise'/);
  assert.match(sql, /'type', 'template'/);
  assert.match(sql, /'type', 'checklist'/);
  assert.match(sql, /'deliverable', t\.deliverable/);
  assert.match(sql, /where block->>'type' = 'exercise'/);

  for (const artifact of [
    "Campaign control brief",
    "Marketing claim register",
    "Campaign launch control sheet",
    "Customer support control desk",
    "Support backlog control board",
    "Support QA scorecard",
    "Product source record",
    "Inventory discrepancy report",
    "E-commerce operations control desk",
  ]) {
    assert.ok(sql.includes(artifact), "Missing practical artifact: " + artifact);
  }
});

test("legacy practice endings are removed after first-class exercises exist", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /lower\(coalesce\(block->>'text',''\)\) = 'practice'/);
  assert.match(sql, /like 'final practice:%'/);
  assert.match(sql, /previous_block->>'type' = 'heading'/);
  assert.match(sql, /block->>'type' in \('paragraph','scenario'\)/);
});

test("existing operations project sales and social drills are promoted instead of duplicated", async () => {
  const [sql, earlier] = await Promise.all([
    readFile(migrationPath, "utf8"),
    readFile(earlierDepthPath, "utf8"),
  ]);

  for (const slug of [
    "operations-virtual-assistant",
    "project-management-for-virtual-assistants",
    "sales-lead-generation-virtual-assistant",
    "social-media-virtual-assistant",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing conversion course: " + slug);
    assert.ok(earlier.includes("'" + slug + "'"), "Earlier drill source missing: " + slug);
  }

  assert.match(sql, /block->>'text' = 'Work product drill'/);
  assert.match(sql, /block->>'type' = 'scenario'/);
  assert.match(sql, /then jsonb_build_object\([\s\S]*'type', 'exercise'/);
});

test("the eight priority courses are covered without resetting progress or assessments", async () => {
  const [sql, executive] = await Promise.all([
    readFile(migrationPath, "utf8"),
    readFile(executivePath, "utf8"),
  ]);

  for (const slug of [
    "executive-virtual-assistant",
    "marketing-virtual-assistant",
    "customer-support-virtual-assistant",
    "operations-virtual-assistant",
    "project-management-for-virtual-assistants",
    "social-media-virtual-assistant",
    "sales-lead-generation-virtual-assistant",
    "ecommerce-virtual-assistant",
  ]) {
    assert.ok(sql.includes("'" + slug + "'"), "Priority course not covered: " + slug);
  }

  assert.match(executive, /'type', 'exercise'/);
  assert.match(executive, /'type', 'template'/);
  assert.match(executive, /'type', 'checklist'/);

  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /update public\.training_assessments/i);
});

test("all practical changes apply only to published learner lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.ok((sql.match(/l\.is_published = true/g) || []).length >= 3);
  assert.doesNotMatch(sql, /status = 'draft'/);
  assert.doesNotMatch(sql, /published_at = null/);
});
