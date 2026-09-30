import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const migration = fs.readFileSync("supabase/migrations/20260930145500_end_to_end_hiring_funnel.sql", "utf8");
const dashboard = fs.readFileSync("src/components/agency-funnel-dashboard.tsx", "utf8");
const loader = fs.readFileSync("src/lib/agency-funnel-metrics.ts", "utf8");
const recruiterPage = fs.readFileSync("src/app/workspace/recruiter/funnel/page.tsx", "utf8");
const adminPage = fs.readFileSync("src/app/workspace/admin/funnel/page.tsx", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");

test("hiring funnel follows one lead cohort from enquiry through hire", () => {
  for (const field of ["discovery_booked","discovery_attended","qualified","shortlisted","interviewed","offered","hired"]) {
    assert.match(migration,new RegExp(field));
  }
  assert.match(migration,/job_shortlist_candidates/);
  assert.match(migration,/candidate_interviews/);
  assert.match(migration,/placement_offers/);
  assert.match(migration,/workrooms/);
  for (const stage of ["Enquiries","Discovery booked","Discovery attended","Qualified","Shortlist","Interview","Offer","Hire"]) {
    assert.match(dashboard,new RegExp(`label:"${stage}"`));
  }
  assert.match(dashboard,/Discovery → hire/);
  assert.match(dashboard,/discoveryToHire/);
  assert.match(dashboard,/Biggest drop-off/);
  assert.match(dashboard,/lossRate/);
  assert.match(dashboard,/conversion/);
});

test("funnel database function stays server-only and timed", () => {
  assert.match(migration,/language sql[\s\S]*stable[\s\S]*security invoker/i);
  assert.match(migration,/revoke all on function public\.agency_funnel_metrics\(integer,uuid\) from public/);
  assert.match(migration,/revoke all on function public\.agency_funnel_metrics\(integer,uuid\) from authenticated/);
  assert.match(migration,/grant execute on function public\.agency_funnel_metrics\(integer,uuid\) to service_role/);
  assert.match(loader,/withServerTiming\("agency\.funnel_summary"/);
  assert.match(loader,/admin\.rpc\("agency_funnel_metrics"/);
});

test("delivery and retention stay separate from sales conversion", () => {
  assert.match(migration,/shortlist_status='released'/);
  assert.match(migration,/recruiting_cohort/);
  assert.match(migration,/retention_base/);
  assert.match(migration,/start_date\+30 between/);
  assert.match(migration,/start_date\+90 between/);
  assert.match(dashboard,/Delivery operations/);
  assert.match(dashboard,/These are not sales conversion stages/);
  assert.match(dashboard,/Retention operations/);
  assert.match(dashboard,/Sales counts client leads/);
});

test("recruiter and admin funnel views have correct scope and fast auth", () => {
  assert.match(recruiterPage,/requireRoleFast\("recruiter"\)/);
  assert.match(recruiterPage,/recruiterId=\{userId\}/);
  assert.match(recruiterPage,/leadsPath="\/workspace\/recruiter\/leads"/);
  assert.match(recruiterPage,/rolesPath="\/workspace\/recruiter\/roles"/);
  assert.match(adminPage,/requireRoleFast\("admin"\)/);
  assert.match(adminPage,/recruiterId=\{null\}/);
  assert.match(adminPage,/leadsPath="\/workspace\/admin\/leads"/);
  assert.match(adminPage,/rolesPath="\/workspace\/admin\/jobs"/);
});

test("agency funnel remains discoverable", () => {
  assert.match(nav,/Agency Funnel/);
  assert.match(nav,/\/workspace\/recruiter\/funnel/);
  assert.match(nav,/\/workspace\/admin\/funnel/);
});
