import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const path = "supabase/migrations/20260924110000_deepen_operations_project_training.sql";

test("deep pass covers all Operations and Project Management lessons", async () => {
  const sql = await readFile(path, "utf8");

  const slugs = [
    "processes-inputs-outputs-owners-and-controls",
    "operational-risk-exceptions-and-escalation",
    "writing-and-maintaining-useful-sops",
    "checklists-templates-and-recurring-task-systems",
    "vendor-supplier-and-contractor-administration",
    "cross-team-handoffs-and-dependency-tracking",
    "operational-data-quality-and-reconciliation",
    "kpi-reporting-and-exception-summaries",
    "finding-bottlenecks-and-repeated-failure-points",
    "automation-awareness-and-safe-change-management",
    "incident-coordination-and-business-continuity-handoffs",
    "composite-operations-va-simulation",
    "projects-scope-deliverables-and-success-criteria",
    "roles-ownership-decisions-and-governance",
    "tasks-dependencies-milestones-and-estimates",
    "timelines-capacity-and-realistic-scheduling",
    "project-boards-statuses-and-work-in-progress",
    "meetings-notes-decisions-and-action-tracking",
    "risks-issues-dependencies-and-escalation",
    "stakeholder-updates-and-status-reporting",
    "scope-changes-requests-and-change-control",
    "quality-checks-acceptance-and-rework",
    "project-handover-documentation-and-retrospective",
    "composite-project-coordination-simulation",
  ];

  for (const slug of slugs) {
    assert.ok(sql.includes("'" + slug + "'"), "Missing deep practice for " + slug);
  }
  assert.equal(slugs.length, 24);
});

test("Operations lessons use distinct job artifacts instead of one repeated template", async () => {
  const sql = await readFile(path, "utf8");

  for (const artifact of [
    "Process control map",
    "Operational exception control board",
    "Operational SOP",
    "Recurring operations control board",
    "Vendor and supplier register",
    "Recurring dependency board",
    "Operational reconciliation log",
    "KPI variance brief",
    "Bottleneck analysis",
    "Controlled automation change brief",
    "Operations incident record",
    "Operations control-desk index",
  ]) {
    assert.ok(sql.includes(artifact), "Missing Operations artifact: " + artifact);
  }
});

test("Project Management lessons build a complete project portfolio", async () => {
  const sql = await readFile(path, "utf8");

  for (const artifact of [
    "Project charter",
    "Decision-rights matrix",
    "Dependency and milestone map",
    "Capacity-aware project schedule",
    "Project board snapshot",
    "Project decision and action log",
    "RAID and decision register",
    "Weekly project status report",
    "Project change request",
    "Acceptance and rework log",
    "Project handover and closeout pack",
    "Project control-pack index",
  ]) {
    assert.ok(sql.includes(artifact), "Missing PM artifact: " + artifact);
  }
});

test("connected simulations use Summit for BAU and BrightPath for finite project work", async () => {
  const sql = await readFile(path, "utf8");

  assert.match(sql, /Summit Service Group/);
  assert.match(sql, /BrightPath Client Portal/);
  assert.match(sql, /This is recurring operations/);
  assert.match(sql, /finite project-coordination simulation/);
});

test("capstones contain realistic evidence packs and role-specific rubrics", async () => {
  const sql = await readFile(path, "utf8");

  for (const phrase of [
    "08:30 operations control board",
    "Booking workflow and controls",
    "Supplier evidence",
    "Job reconciliation extract",
    "Four-week KPI extract",
    "Booking incident evidence",
    "Approved project baseline",
    "Current project work",
    "Capacity and timing constraints",
    "Messy weekly meeting notes",
    "Pre-launch QA findings",
    "Onboarding-video request",
    "Operating control and prioritisation",
    "Scope and governance control",
  ]) {
    assert.ok(sql.includes(phrase), "Missing capstone evidence/rubric: " + phrase);
  }
});

test("migration updates lesson content in place and preserves progress", async () => {
  const sql = await readFile(path, "utf8");

  assert.match(sql, /jsonb_array_elements\(l\.content\)/);
  assert.match(sql, /content_version = l\.content_version \+ 1/);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
  assert.doesNotMatch(sql, /insert into public\.training_courses/i);
});
