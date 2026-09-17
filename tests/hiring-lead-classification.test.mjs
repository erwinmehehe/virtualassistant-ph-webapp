import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const migration = fs.readFileSync(
  "supabase/migrations/20260917001917_fix_hiring_lead_classification_and_closed_crm_views.sql",
  "utf8"
);

test("all public hiring-intent entry points classify into recruiter CRM", () => {
  for (const source of [
    "content_role_brief",
    "public_role_brief",
    "service_match_request",
    "industry_match_request",
    "blog_match_request",
    "talent_shortlist_request",
    "talent_introduction_request",
    "client_discovery_booking"
  ]) {
    assert.match(migration, new RegExp(`'${source}'`));
  }
  assert.match(migration, /new\.lead_type := 'client_hiring'/);
  assert.match(migration, /new\.owner_id := public\.default_recruiter_id\(\)/);
});

test("backfill repairs previously hidden hiring leads", () => {
  assert.match(migration, /update public\.lead_intake l/);
  assert.match(migration, /coalesce\(l\.lead_type,'general'\) = 'general'/);
  assert.match(migration, /select j\.recruiter_id from public\.jobs j where j\.id = l\.job_id/);
});

test("newest-leads view does not make closed leads look active", () => {
  assert.match(migration, /p\.view_name='recent'/);
  assert.match(migration, /coalesce\(l\.status,'new'\) <> 'archived'/);
  assert.match(migration, /coalesce\(l\.crm_stage,'new'\) not in \('won','lost'\)/);
  assert.match(migration, /p\.view_name='all'/);
  assert.match(migration, /p\.view_name='lost'/);
});
