import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924090500_refresh_australian_va_fundamentals.sql";

test("fundamentals stays within the intended 3 to 4 hour range", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /estimated_minutes = 210/);
  assert.equal((sql.match(/estimated_minutes = 25/g) || []).length, 6);
  assert.equal((sql.match(/estimated_minutes = 30/g) || []).length, 2);
  assert.doesNotMatch(sql, /estimated_minutes = (3[1-9]|[4-9]\d)/);
});

test("fundamentals teaches decision rights and source-of-truth operating habits", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Routine: perform under an existing SOP/i);
  assert.match(sql, /Approval: prepare the facts/i);
  assert.match(sql, /Specialist: route to the qualified or regulated role/i);
  assert.match(sql, /Own the workflow, not every decision/i);
  assert.match(sql, /source of truth/i);
});

test("communication lesson removes fake Australian tone and makes dates explicit", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Do not perform Australianness/i);
  assert.match(sql, /4 October 2026/);
  assert.match(sql, /NSW, VIC, QLD, SA, WA, TAS, NT and ACT/);
  assert.match(sql, /Put the confirmed status, required action or decision near the top/i);
});

test("time-zone lesson handles the current 2026 daylight-saving transition", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Sunday 4 October 2026/);
  assert.match(sql, /Sunday 4 April 2027/);
  assert.match(sql, /Queensland does not currently observe daylight saving/i);
  assert.match(sql, /South Australia observes daylight saving/i);
  assert.match(sql, /Never hard-code a recurring offset/i);
});

test("privacy lesson uses the May 2026 OAIC data-minimisation update", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /13 May 2026/);
  assert.match(sql, /data minimisation/i);
  assert.match(sql, /reasonably necessary/i);
  assert.match(sql, /unapproved AI tools/i);
  assert.match(sql, /Minimum necessary is a workflow habit/i);
});

test("finance lesson stays vocabulary-level and routes deeper work to bookkeeping software paths", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /GST is a 10% tax on most goods and services/i);
  assert.match(sql, /Australian Bookkeeping Administration/);
  assert.match(sql, /Xero Workflows for Virtual Assistants/);
  assert.match(sql, /MYOB Workflows for Virtual Assistants/);
  assert.match(sql, /Terminology is not authority/i);
});

test("handoff lesson is decision-focused rather than a task diary", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Completed:/);
  assert.match(sql, /Waiting:/);
  assert.match(sql, /Decisions needed:/);
  assert.match(sql, /Risk\/deadline:/);
  assert.match(sql, /A handoff is not a diary/i);
});

test("final simulation routes specialist work instead of retesting specialist courses", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /Harbour Business Co mixed-work queue/);
  assert.match(sql, /Foundation decision-rights matrix/);
  assert.match(sql, /Australian specialist learning paths/);
  assert.match(sql, /Trades -> Australian Trades Administration -> ServiceM8/);
  assert.match(sql, /Finance -> Australian Bookkeeping Administration -> Xero or MYOB/);
  assert.match(sql, /Property -> Property Management Administration Australia/);
  assert.match(sql, /Mortgage -> Mortgage Broking Administration Australia/);
  assert.match(sql, /"hard_fail":true/);
  assert.match(sql, /pass_score = 80/);
});

test("fundamentals remains editorial-only published training with stable lesson slugs", async () => {
  const sql = await readFile(migrationPath, "utf8");

  for (const slug of [
    "how-australian-small-businesses-work-with-vas",
    "australian-business-language-dates-and-communication",
    "australian-time-zones-daylight-saving-and-scheduling",
    "australian-privacy-personal-information-and-offshore-va-access",
    "abn-gst-bas-invoices-and-finance-terminology-for-vas",
    "australian-customer-service-and-administrative-follow-up",
    "daily-handoffs-between-the-philippines-and-australia",
    "australian-va-composite-work-simulation",
  ]) {
    assert.ok(sql.includes(slug), "Missing stable lesson slug: " + slug);
  }

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /status = 'published'/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
  assert.doesNotMatch(sql, /insert\s+into\s+public\.training_courses/i);
  assert.doesNotMatch(sql, /\/training\/courses\//);
});
