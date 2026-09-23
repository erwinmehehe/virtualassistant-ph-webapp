import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const migrationPath = "supabase/migrations/20260923233000_remove_ndis_specialist_gate.sql";

test("NDIS no longer requires specialist review", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /review_requirement = 'editorial'/);
  assert.match(sql, /status = 'published'/);
  assert.match(sql, /published_at = coalesce\(published_at, now\(\)\)/);
  assert.doesNotMatch(sql, /review_requirement = 'specialist'/);
});

test("NDIS is removed from the specialist review definition registry", async () => {
  const registry = await readFile("src/lib/training-specialist-review.ts", "utf8");

  assert.doesNotMatch(registry, /"ndis-administration-fundamentals"/);
  assert.match(registry, /"property-management-administration-australia"/);
  assert.match(registry, /"mortgage-broking-administration-australia"/);
});

test("active NDIS specialist invites are revoked and the queue row is removed", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /update public\.training_specialist_review_invites/);
  assert.match(sql, /status = 'revoked'/);
  assert.match(sql, /status in \('pending', 'opened'\)/);
  assert.match(sql, /delete from public\.training_specialist_reviews/);
});

test("removing the gate does not erase prior specialist audit history", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.doesNotMatch(sql, /delete from public\.training_specialist_review_events/);
  assert.doesNotMatch(sql, /truncate public\.training_specialist_review_events/);
});

test("NDIS keeps the existing editorial review evidence when published", async () => {
  const sql = await readFile(migrationPath, "utf8");

  assert.match(sql, /reviewed_by = coalesce\(reviewed_by, 'VirtualAssistant\.com\.ph Editorial Team'\)/);
  assert.match(sql, /last_reviewed_at = coalesce\(last_reviewed_at, now\(\)\)/);
  assert.match(sql, /specialist_reviewed_by = null/);
  assert.match(sql, /specialist_reviewer_role = null/);
});
