import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("agency production preflight is read-only and returns one complete JSON result", async () => {
  const sql = await readFile("scripts/agency-release-preflight.sql", "utf8");

  assert.match(sql, /begin transaction read only;/i);
  assert.match(sql, /jsonb_build_object\(/);
  assert.match(sql, /as release_preflight;/);
  assert.match(sql, /rollback;/i);
  assert.match(sql, /v4149_atomic_proposal_acceptance/);
  assert.match(sql, /v4150_server_only_table_grants/);
  assert.match(sql, /v4151_explicit_server_only_rls/);
  assert.match(sql, /lead_proposal_browser_grants/);
  assert.match(sql, /public_view_options/);
  assert.match(sql, /accepted_active_roles_missing_access/);
  assert.match(sql, /accepted_proposals_missing_role_or_commercials/);

  assert.doesNotMatch(sql, /\b(insert|update|delete|truncate|alter|drop|create)\s+(table|view|function|policy|index|into)\b/i);
  assert.doesNotMatch(sql, /proposal_token|access_token|refresh_token/i);
});

test("release readiness records current production and preserves unresolved runtime gates", async () => {
  const readiness = await readFile("AGENCY_RELEASE_READINESS.md", "utf8");

  assert.match(readiness, /634618ff1167f798c06ba4d13b0b80004d3ec013/);
  assert.match(readiness, /dpl_HjUZfp2ArGZC8vJx4wiW4zwqACkH/);
  assert.match(readiness, /dpl_3JzTir6NYJxF3TTzYEqMviLpXn6d/);
  assert.match(readiness, /Accepted active roles missing paid\/comped candidate access: 0/);
  assert.match(readiness, /Accepted proposals missing a linked role or accepted commercials: 0/);
  assert.match(readiness, /Production currently has 0 proposal rows/);
  assert.match(readiness, /Backup\/recovery evidence: pending/);
  assert.match(readiness, /Runtime Auth\/email and full hiring-journey evidence: pending/);
  assert.match(readiness, /Go\/no-go: HOLD/);
});
