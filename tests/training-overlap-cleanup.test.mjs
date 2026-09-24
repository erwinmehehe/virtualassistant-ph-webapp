import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260924082000_training_course_overlap_cleanup.sql";

test("overlap cleanup defines distinct scope for all adjacent training courses", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const slug of [
    "marketing-virtual-assistant",
    "social-media-virtual-assistant",
    "operations-virtual-assistant",
    "project-management-for-virtual-assistants",
    "medical-healthcare-virtual-assistant",
    "australian-allied-health-administration",
    "bookkeeping-administration",
    "australian-bookkeeping-administration",
    "xero-workflows-for-virtual-assistants",
    "myob-workflows-for-virtual-assistants",
  ]) {
    assert.ok(sql.includes(slug), "Missing scope update for " + slug);
  }

  assert.match(sql, /Course scope: campaign operations/);
  assert.match(sql, /Course scope: social channel operations/);
  assert.match(sql, /Course scope: recurring business operations/);
  assert.match(sql, /Course scope: finite projects/);
  assert.match(sql, /Course scope: healthcare administration foundations/);
  assert.match(sql, /Course scope: Australian allied-health practice operations/);
  assert.match(sql, /Course scope: software-neutral bookkeeping administration/);
  assert.match(sql, /Course scope: Australian bookkeeping overlay/);
  assert.match(sql, /Course scope: execute approved work inside Xero/);
  assert.match(sql, /Course scope: execute approved work inside MYOB Business/);
});

test("marketing and social media own different work outputs", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /Campaign Content Briefs and Production Tracking/);
  assert.match(sql, /Campaign Lead Routing and Sales Handoff/);
  assert.match(sql, /Social Launch Coordination and Platform Readiness/);
  assert.match(sql, /creator\/UGC permission tracking/);
  assert.match(sql, /Do not rebuild email, CRM, landing-page, or broader cross-channel campaign operations/);
});

test("operations and project management are separated by BAU versus finite project work", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /Recurring Operational Handoffs and Service Dependencies/);
  assert.match(sql, /Operational Automation and Controlled Process Changes/);
  assert.match(sql, /Project Roles, Decision Rights, and Governance/);
  assert.match(sql, /ongoing operating system/);
  assert.match(sql, /finite project-coordination simulation/);
});

test("healthcare foundation and Australian allied health no longer duplicate scope", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /country-agnostic healthcare administration simulation/);
  assert.match(sql, /Australian Allied Health Intake, Forms, and Referral Readiness/);
  assert.match(sql, /Allied Health Appointment Types, Practitioner Calendars, and No-Shows/);
  assert.match(sql, /funding-pathway and billing exceptions/);
  assert.match(sql, /rather than retesting the full healthcare foundation/);
});

test("bookkeeping curriculum follows foundation then Australia overlay then product execution", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /Learn the bookkeeping workflow before learning a jurisdiction or product/);
  assert.match(sql, /Australian Source Documents and GST-Sensitive Evidence/);
  assert.match(sql, /Australian Month-End, BAS Pack, and Accountant Handoff/);
  assert.match(sql, /Running Approved Sales Invoice and Credit Workflows in Xero/);
  assert.match(sql, /Preparing Xero GST\/BAS Review Evidence/);
  assert.match(sql, /Running Sales and Purchase Workflows in MYOB Business/);
  assert.match(sql, /Preparing MYOB GST\/BAS Review Evidence/);
  assert.match(sql, /tests execution inside Xero, not generic bookkeeping theory/);
  assert.match(sql, /tests execution inside MYOB Business, not generic bookkeeping theory/);
});

test("overlap cleanup preserves release policy and learner progress", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.doesNotMatch(sql, /review_requirement/);
  assert.doesNotMatch(sql, /status\s*=/);
  assert.doesNotMatch(sql, /delete\s+from\s+public\.training_/i);
  assert.doesNotMatch(sql, /training_lesson_progress/i);
  assert.doesNotMatch(sql, /training_enrollments/i);
  assert.doesNotMatch(sql, /training_certificates/i);
});
