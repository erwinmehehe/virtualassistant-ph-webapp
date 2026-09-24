import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const artifactPath =
  "supabase/migrations/20260924132000_finish_airbnb_str_artifacts.sql";
const evidencePath =
  "supabase/migrations/20260924132500_deepen_airbnb_str_evidence.sql";

test("Airbnb / STR gets 12 lesson-specific operations artifacts", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "Guest journey and source-system control map",
    "Property facts and listing discrepancy register",
    "Reservation administration and guest-detail exception tracker",
    "Calendar conflict and availability containment log",
    "Guest messaging and access-release record",
    "Guest complaint and incident triage log",
    "Turnover readiness and arrival-release board",
    "Maintenance and vendor incident queue",
    "Commercial change and discount approval request",
    "Post-stay review and owner reporting pack",
    "Multi-property end-of-shift handoff",
    "Coastline Stays multi-property control-desk portfolio",
  ]) {
    assert.ok(sql.includes(phrase), "Missing STR artifact: " + phrase);
  }
});

test("STR artifact pass replaces generic templates and QA checklists in place", async () => {
  const sql = await readFile(artifactPath, "utf8");

  assert.match(sql, /when b\.block->>'type'='template'/);
  assert.match(sql, /when b\.block->>'type'='checklist'/);
  assert.doesNotMatch(sql, /insert into public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lessons/i);
  assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
});

test("additional worked examples cover remaining STR judgment gaps", async () => {
  const sql = await readFile(artifactPath, "utf8");

  for (const phrase of [
    "public listing text is not automatically the source of truth",
    "collect only what the booking workflow actually needs",
    "cleaner complete is not the same as guest-ready",
    "report the complaint and the evidence separately",
  ]) {
    assert.ok(sql.includes(phrase), "Missing worked example: " + phrase);
  }

  assert.match(sql, /b\.ord<ex\.exercise_ord/);
  assert.match(sql, /b\.ord>=ex\.exercise_ord/);
  assert.match(sql, /e->>'title'=t\.example_title/);
});

test("Coastline Stays capstone adds cross-file property, calendar, vendor, and owner evidence", async () => {
  const sql = await readFile(evidencePath, "utf8");

  for (const phrase of [
    "Coastline Stays approved property facts",
    "PMS and channel calendar extract",
    "Turnover, access, and maintenance evidence",
    "Owner reporting and post-stay records",
  ]) {
    assert.ok(sql.includes(phrase), "Missing capstone evidence: " + phrase);
  }
});

test("assessment evidence append is idempotent", async () => {
  const sql = await readFile(evidencePath, "utf8");

  for (const id of [
    "property_facts",
    "pms_calendar",
    "vendor_evidence",
    "owner_reporting",
  ]) {
    assert.ok(sql.includes("r->>'id'='"+id+"'"), "Missing duplicate guard: " + id);
  }
});

test("STR follow-up migrations preserve learner history and course identity", async () => {
  for (const path of [artifactPath, evidencePath]) {
    const sql = await readFile(path, "utf8");
    assert.doesNotMatch(sql, /delete from public\.training_lesson_progress/i);
    assert.doesNotMatch(sql, /insert into public\.training_courses/i);
    assert.doesNotMatch(sql, /delete from public\.training_courses/i);
  }
});
