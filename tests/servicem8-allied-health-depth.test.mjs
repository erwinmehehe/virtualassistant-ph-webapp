import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactPath =
  "supabase/migrations/20260924135000_finish_servicem8_allied_health_artifacts.sql";
const assessmentPath =
  "supabase/migrations/20260924135500_connect_servicem8_allied_health_assessments.sql";

test("ServiceM8 gets 8 lesson-specific operational artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "ServiceM8 status and Queue control board",
    "ServiceM8 client and job-card data-quality record",
    "ServiceM8 dispatch feasibility board",
    "ServiceM8 quote acceptance and follow-up control log",
    "ServiceM8 completion evidence and return-work record",
    "ServiceM8 invoice and payment exception reconciliation log",
    "ServiceM8 automation QA and exception register",
    "Harbour Field Services ServiceM8 control-desk portfolio",
  ]) {
    assert.ok(sql.includes(phrase), "Missing ServiceM8 artifact: " + phrase);
  }
});

test("Australian Allied Health gets 8 lesson-specific administration artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "Allied health admin authority and clinical-boundary map",
    "Health-information incident containment and escalation record",
    "Patient intake and referral-readiness exception tracker",
    "Referral identity-resolution and practitioner handoff sheet",
    "Allied health appointment-fit and schedule exception board",
    "Recall and waitlist source-validation queue",
    "Allied health billing and funding exception tracker",
    "Rivergum Allied Health administration control-desk portfolio",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Allied Health artifact: " + phrase);
  }
});

test("worked examples cover high-judgment ServiceM8 and allied-health decisions", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "a Queue explains waiting; it does not replace core status",
    "an open Dispatch Board slot is not enough evidence to promise it",
    "a customer question interrupts routine follow-up",
    "a matching-looking bank receipt is not yet reconciled payment",
    "the VA routes the clinical question instead of choosing the provider",
    "contain the privacy incident; do not decide the legal outcome",
    "a plausible patient match is not enough to attach a referral",
    "fix administrative evidence without deciding funding eligibility",
  ]) {
    assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);
  }

  assert.match(sql, /b\.ord<ex\.exercise_ord/);
  assert.match(sql, /b\.ord>=ex\.exercise_ord/);
  assert.match(sql, /e->>'title'=t\.example_title/);
});

test("ServiceM8 final uses a connected 8-resource Harbour Field Services case", async () => {
  const sql = await readFile(assessmentPath, "utf8");

  for (const phrase of [
    "Harbour Field Services ServiceM8 operations simulation",
    "Harbour Field Services ServiceM8 morning queue",
    "Client, job card and history notes",
    "Staff capability and dispatch constraints",
    "Quote and acceptance evidence",
    "Completion and return-work evidence",
    "Invoice and accounting exception file",
    "ServiceM8 automation QA rules",
    "Harbour Field Services ServiceM8 authority matrix",
  ]) {
    assert.ok(sql.includes(phrase), "Missing ServiceM8 assessment element: " + phrase);
  }

  for (const rubric of [
    "ServiceM8 status and Queue accuracy",
    "Client, job-card and history accuracy",
    "Scheduling and dispatch feasibility",
    "Quote-to-invoice workflow execution",
    "Technical, commercial, finance and safety boundaries",
    "Automation QA and owner handoff",
  ]) {
    assert.ok(sql.includes(rubric), "Missing ServiceM8 rubric: " + rubric);
  }
});

test("Allied Health final uses a connected 8-resource Rivergum case", async () => {
  const sql = await readFile(assessmentPath, "utf8");

  for (const phrase of [
    "Rivergum Allied Health Australian practice-administration simulation",
    "Rivergum Allied Health practice structure and authority",
    "Rivergum practice admin queue",
    "Intake, demographic and referral-readiness extract",
    "Rivergum appointment and calendar matrix",
    "Recall and waitlist task records",
    "Billing and funding exception file",
    "Privacy incident and health-information handling file",
    "Rivergum allied-health administration boundaries",
    "Routine patient-message constraints",
  ]) {
    assert.ok(sql.includes(phrase), "Missing Allied Health assessment element: " + phrase);
  }

  for (const rubric of [
    "Intake, referral and identity accuracy",
    "Appointment and recall workflow execution",
    "Health-information privacy and incident handling",
    "Clinical and funding boundaries",
    "Billing and administrative exception handling",
    "Patient communication and practice handoff",
  ]) {
    assert.ok(sql.includes(rubric), "Missing Allied Health rubric: " + rubric);
  }
});

test("follow-up migrations preserve learner identity and history", async () => {
  for (const path of [artifactPath, assessmentPath]) {
    const sql = await readFile(path, "utf8");
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(sql, /insert into public\.training_courses/i);
    assert.doesNotMatch(sql, /delete from public\.training_courses/i);
    assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
    assert.doesNotMatch(sql, /delete from public\.training_assessment_submissions/i);
  }
});
