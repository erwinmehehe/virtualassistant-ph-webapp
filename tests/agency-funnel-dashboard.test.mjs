import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260917180500_agency_funnel_metrics.sql", "utf8");
const dashboard = fs.readFileSync("src/components/agency-funnel-dashboard.tsx", "utf8");
const recruiterPage = fs.readFileSync("src/app/workspace/recruiter/funnel/page.tsx", "utf8");
const adminPage = fs.readFileSync("src/app/workspace/admin/funnel/page.tsx", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");

test("sales funnel uses client hiring leads and only counts published recruiting handoffs as active job orders", () => {
  assert.match(migration, /l\.lead_type='client_hiring'/);
  assert.match(migration, /j\.published_at is not null/);
  assert.match(migration, /active_job_orders/);
  assert.doesNotMatch(migration, /count\(\*\).*job_id is not null.*active_job_orders/s);
});

test("recruiting funnel follows one published-role cohort through shortlist interview offer and placement", () => {
  assert.match(migration, /j\.published_at>=p\.cutoff/);
  assert.match(migration, /shortlist_status='released'/);
  assert.match(migration, /candidate_interviews/);
  assert.match(migration, /placement_offers/);
  assert.match(migration, /workrooms/);
  assert.match(migration, /avg_days_to_shortlist/);
  assert.match(migration, /avg_days_to_start/);
});

test("retention is milestone based instead of treating every active placement as 30 or 90 day retained", () => {
  assert.match(migration, /start_date\+30 between/);
  assert.match(migration, /ended_at::date>=start_date\+30/);
  assert.match(migration, /start_date\+90 between/);
  assert.match(migration, /ended_at::date>=start_date\+90/);
});

test("recruiter and admin funnel views have correct scope and role-aware review links", () => {
  assert.match(recruiterPage, /recruiterId=\{user\.id\}/);
  assert.match(recruiterPage, /leadsPath="\/workspace\/recruiter\/leads"/);
  assert.match(recruiterPage, /rolesPath="\/workspace\/recruiter\/roles"/);
  assert.match(adminPage, /recruiterId=\{null\}/);
  assert.match(adminPage, /leadsPath="\/workspace\/admin\/leads"/);
  assert.match(adminPage, /rolesPath="\/workspace\/admin\/jobs"/);
});

test("agency funnel is discoverable and explains cohort limitations", () => {
  assert.match(nav, /Agency Funnel/);
  assert.match(nav, /\/workspace\/recruiter\/funnel/);
  assert.match(nav, /\/workspace\/admin\/funnel/);
  assert.match(dashboard, /separate cohorts/);
  assert.match(dashboard, /These are not attributed causes/);
  assert.match(dashboard, /30-day retained/);
  assert.match(dashboard, /90-day retained/);
});
