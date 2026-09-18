import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const migration = fs.readFileSync(
  "supabase/migrations/20260918110000_complete_hiring_lead_classification.sql",
  "utf8"
);

const hiringSources = [
  "content_role_brief",
  "public_role_brief",
  "service_match_request",
  "industry_match_request",
  "blog_match_request",
  "talent_shortlist_request",
  "talent_introduction_request",
  "client_discovery_booking"
];

test("every hiring-intent entry point is classified as a client hiring lead", () => {
  for (const source of hiringSources) assert.match(migration, new RegExp(`'${source}'`));
  assert.match(migration, /new\.lead_type := 'client_hiring'/);
});

test("hiring-intent leads receive a recruiter owner without reopening closed leads", () => {
  assert.match(migration, /new\.owner_id := public\.default_recruiter_id\(\)/);
  assert.match(migration, /not in \('won','lost'\)/);
  assert.match(migration, /select j\.recruiter_id from public\.jobs j where j\.id = l\.job_id/);
});

test("classification repair does not replace the recruiter leads page RPC", () => {
  assert.doesNotMatch(migration, /create or replace function public\.recruiter_leads_page/);
});
