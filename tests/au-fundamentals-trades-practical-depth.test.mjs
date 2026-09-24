import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath =
  "supabase/migrations/20260924190000_deepen_au_fundamentals_trades_practical_training.sql";

const lessons = {
  "australian-va-fundamentals": [
    "how-australian-small-businesses-work-with-vas",
    "australian-business-language-dates-and-communication",
    "australian-time-zones-daylight-saving-and-scheduling",
    "australian-privacy-personal-information-and-offshore-va-access",
    "abn-gst-bas-invoices-and-finance-terminology-for-vas",
    "australian-customer-service-and-administrative-follow-up",
    "daily-handoffs-between-the-philippines-and-australia",
    "australian-va-composite-work-simulation",
  ],
  "australian-trades-administration": [
    "from-customer-enquiry-to-completed-job",
    "emergency-urgent-and-routine-job-triage",
    "scheduling-technicians-travel-and-job-windows",
    "quote-administration-and-follow-up",
    "customer-updates-delays-and-job-completion",
    "supplier-parts-and-purchase-administration",
    "invoicing-payment-follow-up-and-accounting-handoff",
    "australian-trades-composite-work-simulation",
  ],
};

test("all sixteen lessons receive first-class practical work", async () => {
  const sql = await readFile(migrationPath, "utf8");
  let count = 0;

  for (const slugs of Object.values(lessons)) {
    for (const slug of slugs) {
      assert.ok(sql.includes("'" + slug + "'"), "Missing lesson practical spec: " + slug);
      count += 1;
    }
  }

  assert.equal(count, 16);
  assert.match(sql, /'type','exercise'/);
  assert.match(sql, /'type','template'/);
  assert.match(sql, /'type','checklist'/);
});

test("Australian VA Fundamentals produces real cross-border admin artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const artifact of [
    "Australian client operating map",
    "Australian communication and date-control record",
    "Australia-Philippines calendar control sheet",
    "Australian privacy and incident work record",
    "Australian finance-admin terminology handoff",
    "Australian customer exception and follow-up queue",
    "Philippines-to-Australia end-of-day handoff",
    "Harbour Business Co administration control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing fundamentals artifact: " + artifact);
  }

  assert.match(sql, /recurring meeting stays anchored to Sydney/i);
  assert.match(sql, /contain first, interpret later/i);
});

test("Australian Trades produces end-to-end operating artifacts", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const artifact of [
    "Trades lead-to-paid job control board",
    "Trades enquiry triage and escalation log",
    "Trades technician dispatch feasibility board",
    "Trades quote acceptance and variation log",
    "Trades completion and customer exception log",
    "Trades supplier and parts dependency tracker",
    "Trades invoice and payment exception handoff",
    "Harbourline trades operations control pack",
  ]) {
    assert.ok(sql.includes(artifact), "Missing trades artifact: " + artifact);
  }

  assert.match(sql, /escalation is not diagnosis/i);
  assert.match(sql, /an empty slot is not capacity/i);
  assert.match(sql, /visit finished does not mean job finished/i);
  assert.match(sql, /hold duplicate chasing while finance verifies/i);
});

test("both finals use connected evidence packs and hard-fail boundaries", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbour Business Co Australian VA Fundamentals Final Simulation/);
  assert.match(sql, /Harbourline Australian Trades Administration Final Simulation/);
  assert.equal((sql.match(/"hard_fail":true/g) || []).length, 2);
  assert.ok((sql.match(/pass_score = 80/g) || []).length >= 2);
  assert.ok((sql.match(/resource_pack =/g) || []).length >= 2);
});

test("learner history and publication state are preserved", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /where l\.is_published = true/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /status\s*=\s*'draft'/i);
});
