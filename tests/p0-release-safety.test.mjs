import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260912_v4149_atomic_proposal_acceptance.sql", "utf8");
const proposals = fs.readFileSync("src/app/actions/proposals.ts", "utf8");
const handoff = fs.readFileSync("src/lib/client-handoff.ts", "utf8");

function acceptanceActionSource() {
  const marker = "export async function acceptLeadProposalAction";
  const start = proposals.indexOf(marker);
  assert.notEqual(start, -1, "acceptLeadProposalAction must exist");
  return proposals.slice(start);
}

test("proposal acceptance is delegated to the atomic database function", () => {
  const source = acceptanceActionSource();
  assert.match(source, /rpc\("accept_lead_proposal_atomic"/);
  assert.doesNotMatch(source, /from\("job_commercials"\)/);
  assert.doesNotMatch(source, /from\("job_candidate_access"\)/);
  assert.doesNotMatch(source, /from\("jobs"\)\.insert/);
  assert.doesNotMatch(source, /from\("jobs"\)\.update/);
  assert.doesNotMatch(source, /from\("lead_intake"\)\.update/);
  assert.doesNotMatch(source, /from\("lead_proposals"\)\.update\(\{\s*status:\s*"accepted"/s);
});

test("atomic function locks the proposal and lead before mutating hiring state", () => {
  assert.match(migration, /from public\.lead_proposals[\s\S]*where public_token = p_token[\s\S]*for update;/i);
  assert.match(migration, /from public\.lead_intake[\s\S]*where id = v_proposal\.lead_id[\s\S]*for update;/i);
  assert.match(migration, /status = 'accepted'/i);
  assert.match(migration, /crm_stage = 'won'/i);
  assert.match(migration, /insert into public\.job_commercials/i);
  assert.match(migration, /insert into public\.job_candidate_access/i);
});

test("atomic function is service-role only", () => {
  assert.match(migration, /security definer/i);
  assert.match(migration, /set search_path = pg_catalog, public/i);
  assert.match(migration, /revoke all on function public\.accept_lead_proposal_atomic[\s\S]*from public;/i);
  assert.match(migration, /revoke all on function public\.accept_lead_proposal_atomic[\s\S]*from anon, authenticated;/i);
  assert.match(migration, /grant execute on function public\.accept_lead_proposal_atomic[\s\S]*to service_role;/i);
});

test("client handoff refuses mismatched existing identities", () => {
  assert.match(handoff, /existing_client_missing/);
  assert.match(handoff, /identity_mismatch/);
  assert.match(handoff, /existingEmail !== leadEmail/);
  assert.match(handoff, /resolvedEmail !== leadEmail/);
});

test("client handoff does not authorize from user metadata or mutate core hiring rows", () => {
  assert.doesNotMatch(handoff, /user_metadata\?\.role/);
  assert.doesNotMatch(handoff, /from\("lead_intake"\)\.update/);
  assert.doesNotMatch(handoff, /from\("jobs"\)\.update/);
  assert.match(handoff, /user_metadata\?\.full_name/);
});
