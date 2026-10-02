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

  assert.match(readiness, /038f318838727e4a6f8abbb01346e0a93e2c16f1/);
  assert.match(readiness, /dpl_HYMbthfBsQK3o7LPcgSMEAA6oo82/);
  assert.match(readiness, /dpl_2HE99v4t4CL428TtwTxo9zhDA6Mw/);
  assert.match(readiness, /Accepted active roles missing paid\/comped candidate access: 0/);
  assert.match(readiness, /Accepted proposals missing a linked role or accepted commercials: 0/);
  assert.match(readiness, /both `curated_placement` and `managed_service`/);
  assert.match(readiness, /29 sent, 29 delivered, 0 failed, 0 bounced, and 0 complained/);
  assert.match(readiness, /Supabase Free/);
  assert.match(readiness, /Backup\/recovery evidence: BLOCKED/);
  assert.match(readiness, /Browser Auth\/workspace and remaining proposal-response lifecycle: pending/);
  assert.match(readiness, /Go\/no-go: HOLD/);
});
