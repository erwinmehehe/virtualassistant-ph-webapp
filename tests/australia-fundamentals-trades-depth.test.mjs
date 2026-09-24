import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactPath =
  "supabase/migrations/20260924133000_finish_australia_fundamentals_trades_artifacts.sql";
const assessmentPath =
  "supabase/migrations/20260924133500_connect_australia_fundamentals_trades_assessments.sql";

test("Australian VA Fundamentals gets 8 lesson-specific admin artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "Australian VA delegation and authority map",
    "Australian communication and date-verification sheet",
    "Australian time-zone and DST scheduling record",
    "Australian personal-information minimisation and access log",
    "Australian finance-admin terminology and escalation sheet",
    "Australian customer follow-up and escalation log",
    "Philippines-to-Australia daily handoff board",
    "Banksia Business Services Australian VA control-desk portfolio",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Fundamentals artifact: " + phrase);
  }
});

test("Australian Trades Administration gets 8 lesson-specific field-service artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "Trade job intake and lifecycle record",
    "Trades triage and emergency-routing queue",
    "Technician dispatch feasibility board",
    "Trade quote administration and approval tracker",
    "Trade job status and customer-update record",
    "Trades parts and supplier dependency tracker",
    "Job-to-invoice evidence and accounting handoff",
    "Redgum Trade Services dispatch and admin control-desk portfolio",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Trades artifact: " + phrase);
  }
});

test("worked examples cover high-judgment Australian VA and trades tasks", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "Australia time' is not a usable scheduling rule",
    "access to a spreadsheet does not make every field necessary",
    "recognising GST language is not the same as deciding GST treatment",
    "handoff priority follows the Australian workday, not inbox order",
    "record symptoms, not the customer's diagnosis",
    "an emergency script is a routing control, not a licence to diagnose",
    "an empty calendar slot can still be impossible",
    "completed job status does not make the invoice ready",
  ]) {
    assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);
  }

  assert.match(sql, /b\.ord<ex\.exercise_ord/);
  assert.match(sql, /b\.ord>=ex\.exercise_ord/);
  assert.match(sql, /e->>'title'=t\.example_title/);
});

test("Australian VA Fundamentals final uses a connected 8-resource Banksia case", async () => {
  const sql = await readFile(assessmentPath, "utf8");

  for (const phrase of [
    "Banksia Business Services Australian VA control-desk simulation",
    "Banksia Business Services client context",
    "Banksia Australian work queue",
    "Australian communication and date samples",
    "Australian time-zone and DST exercise",
    "Complaint-analysis data sample",
    "Supplier invoice administration file",
    "Customer and supplier follow-up records",
    "Banksia Australian VA working boundaries",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Fundamentals assessment element: " + phrase);
  }

  for (const rubric of [
    "Australian context and source accuracy",
    "Dates, time zones and scheduling",
    "Privacy-safe administration",
    "Finance and professional boundaries",
    "Customer and administrative execution",
    "QA and Philippines-to-Australia handoff",
  ]) {
    assert.ok(sql.includes(rubric), "Missing Fundamentals rubric: " + rubric);
  }
});

test("Australian Trades final uses a connected 8-resource Redgum case", async () => {
  const sql = await readFile(assessmentPath, "utf8");

  for (const phrase of [
    "Redgum Trade Services Australian field-service administration simulation",
    "Redgum Trades dispatch queue",
    "Technician capability and dispatch constraints",
    "Redgum trades admin authority",
    "Technician and job-status notes",
    "Quote and customer follow-up file",
    "Supplier and parts dependency file",
    "Job-to-invoice and accounts file",
    "Approved Redgum triage and customer-contact rules",
    "Redgum end-of-day control points",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Trades assessment element: " + phrase);
  }

  for (const rubric of [
    "Triage and safety routing",
    "Dispatch feasibility",
    "Job lifecycle and field evidence",
    "Technical, commercial and finance boundaries",
    "Customer and supplier communication",
    "QA and operational handoff",
  ]) {
    assert.ok(sql.includes(rubric), "Missing Trades rubric: " + rubric);
  }
});

test("follow-up migrations preserve course and learner identity", async () => {
  for (const path of [artifactPath, assessmentPath]) {
    const sql = await readFile(path, "utf8");
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(sql, /insert into public\.training_courses/i);
    assert.doesNotMatch(sql, /delete from public\.training_courses/i);
    assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  }
});
