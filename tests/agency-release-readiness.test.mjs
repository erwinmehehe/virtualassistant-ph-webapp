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

  assert.match(readiness, /137447aa5357cc847d1ac9b08de0c2be4e2b1515/);
  assert.match(readiness, /dpl_H7Wq5tZVMFWeBg8YjF7wH9ar6Aky/);
  assert.match(readiness, /dpl_DQSTpi6Np7MDcui8R9RTbFA82PXF/);
  assert.match(readiness, /Accepted active roles missing paid\/comped candidate access: 0/);
  assert.match(readiness, /Accepted proposals missing a linked role or accepted commercials: 0/);
  assert.match(readiness, /both `curated_placement` and `managed_service`/);
  assert.match(readiness, /latest 50 webhook deliveries succeeded/);
  assert.match(readiness, /0 failed\/bounced\/complained events/);
  assert.match(readiness, /maintenance_completed/);
  assert.match(readiness, /sales_follow_up_due/);
  assert.match(readiness, /\| \[x\] \| Operations \| Maintenance and reminders \|/);
  assert.match(readiness, /Supabase Free/);
  assert.match(readiness, /Backup\/recovery evidence: BLOCKED/);
  assert.match(readiness, /Browser Auth\/workspace and remaining proposal-response lifecycle: pending/);
  assert.match(readiness, /Go\/no-go: HOLD/);
});
