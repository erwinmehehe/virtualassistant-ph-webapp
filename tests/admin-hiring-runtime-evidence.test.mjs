import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin system setup exposes privacy-safe hiring loop runtime evidence", async () => {
  const page = await readFile("src/app/workspace/admin/system/page.tsx", "utf8");

  assert.match(page, /Hiring loop runtime evidence/);
  assert.match(page, /Live database evidence/);
  assert.match(page, /No durable runtime row yet/);
  assert.match(page, /lead_intake/);
  assert.match(page, /lead_proposals/);
  assert.match(page, /job_commercials/);
  assert.match(page, /job_candidate_access/);
  assert.match(page, /job_shortlist_candidates/);
  assert.match(page, /candidate_interviews/);
  assert.match(page, /placement_offers/);
  assert.match(page, /workrooms/);
  assert.match(page, /head: true/);
});

test("runtime evidence queries never select client or candidate content", async () => {
  const page = await readFile("src/app/workspace/admin/system/page.tsx", "utf8");
  const evidenceStart = page.indexOf("const [");
  const evidenceEnd = page.indexOf("const adminEmail", evidenceStart);
  const queries = page.slice(evidenceStart, evidenceEnd);

  assert.ok(evidenceStart >= 0 && evidenceEnd > evidenceStart);
  assert.doesNotMatch(queries, /select\("(?:[^"]*\b)?(?:email|name|phone|message|public_token|acceptance_name|decline_reason|decision_note)(?:\b[^"]*)?"/i);
  assert.doesNotMatch(queries, /auth\.admin\.listUsers/);
});

test("admin runtime evidence distinguishes durable rows from rollback-only QA", async () => {
  const page = await readFile("src/app/workspace/admin/system/page.tsx", "utf8");

  assert.match(page, /Zero does not mean the code path is broken/);
  assert.match(page, /Rollback-only acceptance QA/);
  assert.match(page, /release-readiness file/);
});
