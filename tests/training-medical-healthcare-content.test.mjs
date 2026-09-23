import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migrationPath = "supabase/migrations/20260923110000_write_medical_healthcare_va_training.sql";

test("Medical Healthcare VA course fills all twelve planned lessons", async () => {
  const sql = await readFile(migrationPath, "utf8");
  const ids = new Set(sql.match(/22000003-0000-4000-8000-0000000000\d{2}/g) || []);
  assert.equal(ids.size, 12);
  assert.match(sql, /What a Healthcare VA Can and Cannot Do|Administrative confidence is not clinical authority/);
  assert.match(sql, /Patient Intake and Demographic Checks|Duplicate-record risk/);
  assert.match(sql, /Claims, Remittances, and Exception Tracking|medical necessity/);
  assert.match(sql, /Composite Healthcare Admin Simulation|priority table/i);
});

test("Healthcare training keeps clinical and regulated decisions outside the VA role", async () => {
  const sql = await readFile(migrationPath, "utf8");
  for (const boundary of [
    "Do not diagnose",
    "Do not interpret",
    "Do not change clinical documentation",
    "Do not triage",
    "coding or medical-necessity decisions",
  ]) {
    assert.match(sql.toLowerCase(), new RegExp(boundary.toLowerCase().replace(/[.*+?^$\{\}()|[\]\\]/g, "\\$&")));
  }
  assert.match(sql, /client''s approved policy/i);
  assert.match(sql, /approved emergency or clinical escalation script/i);
});

test("Healthcare privacy lesson reflects minimum-necessary and approved-access principles", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /minimum-necessary/i);
  assert.match(sql, /covered entities and business associates/i);
  assert.match(sql, /Use the least permission level/i);
  assert.match(sql, /Do not paste patient data into unapproved AI tools/i);
  assert.match(sql, /Report lost devices, suspicious sign-ins, wrong-recipient messages/i);
});

test("Healthcare course stays draft until human review", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /status='draft'/);
  assert.match(sql, /published_at=null/);
  assert.match(sql, /reviewed_by=null/);
  assert.match(sql, /last_reviewed_at=null/);
  assert.match(sql, /is_published=false/);
});

test("Healthcare final assessment tests work output rather than trivia", async () => {
  const sql = await readFile(migrationPath, "utf8");
  assert.match(sql, /prioritized work queue/i);
  assert.match(sql, /patient-facing administrative messages/i);
  assert.match(sql, /privacy-incident note/i);
  assert.match(sql, /end-of-shift handoff/i);
  assert.match(sql, /pass_score=80/);
  assert.match(sql, /Do not provide diagnosis, clinical advice, treatment recommendations/i);
});
