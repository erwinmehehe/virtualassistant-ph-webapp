import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage keeps one compact hiring form in the hero", async () => {
  const [page, form, css] = await Promise.all([
    read("src/app/(public)/page.tsx"),
    read("src/components/HomeLeadForm.tsx"),
    read("src/app/public-redesign.css")
  ]);

  assert.equal((page.match(/<HomeLeadForm/g) || []).length, 1);
  assert.match(page, /hero-form-shell/);
  assert.match(form, /homepage_form_start/);
  assert.match(form, /homepage_form_submit/);
  assert.match(css, /\.hero-form-shell[\s\S]*max-width/);
});

test("large page styles are scoped to their route", async () => {
  const [home, matcher, talent, globals] = await Promise.all([
    read("src/app/(public)/page.tsx"),
    read("src/app/workspace/recruiter/matching/[jobId]/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
    read("src/app/globals.css")
  ]);

  assert.match(home, /public-redesign\.css/);
  assert.match(matcher, /matcher\.css/);
  assert.match(talent, /talent-directory\.css/);
  assert.doesNotMatch(globals, /matcher-workspace/);
  assert.doesNotMatch(globals, /talent-directory/);
});

test("dashboard overview payloads use consolidated RPC fast paths", async () => {
  const [data, migration] = await Promise.all([
    read("src/lib/data.ts"),
    read("supabase/migrations/20260912113000_dashboard_overview_rpcs.sql")
  ]);

  assert.match(data, /recruiter_dashboard_overview/);
  assert.match(data, /client_dashboard_overview/);
  assert.match(data, /va_dashboard_overview/);
  assert.match(migration, /create or replace function public\.recruiter_dashboard_overview/);
  assert.match(migration, /create or replace function public\.client_dashboard_overview/);
  assert.match(migration, /create or replace function public\.va_dashboard_overview/);
});

test("workspace and public Core Web Vitals are recorded", async () => {
  const [workspace, publicLayout, vitals] = await Promise.all([
    read("src/app/workspace/layout.tsx"),
    read("src/app/(public)/layout.tsx"),
    read("src/components/WebVitals.tsx")
  ]);

  assert.match(workspace, /<WebVitals surface="workspace"/);
  assert.match(publicLayout, /<WebVitals surface="public"/);
  assert.match(vitals, /useReportWebVitals/);
  assert.match(vitals, /navigator\.sendBeacon/);
});

test("conversion analytics accepts and reports the complete homepage funnel", async () => {
  const [analytics, sales, dashboard, migration] = await Promise.all([
    read("src/lib/analytics.ts"),
    read("src/lib/sales-data.ts"),
    read("src/app/workspace/recruiter/page.tsx"),
    read("supabase/migrations/20260912231500_lead_response_sla_and_conversion.sql")
  ]);

  assert.match(analytics, /send\("homepage_view"/);
  assert.match(analytics, /send\("form_start"/);
  assert.match(analytics, /send\("form_submit"/);
  assert.match(analytics, /send\("booking_click"/);
  assert.match(sales, /recruiter_conversion_summary/);
  for (const stage of ["Homepage visits", "Form starts", "Form submissions", "Discovery booked", "Qualified", "Proposal sent", "Clients won"]) {
    assert.match(sales, new RegExp(stage));
  }
  assert.match(dashboard, /Homepage-to-client funnel/);
  assert.match(migration, /security definer/);
  assert.match(migration, /grant execute[\s\S]*to service_role/);
});

test("lead response SLA creates immediate and scheduled recruiter alerts", async () => {
  const [migration, workflow, visual, vercel] = await Promise.all([
    read("supabase/migrations/20260912231500_lead_response_sla_and_conversion.sql"),
    read(".github/workflows/dashboard-visual.yml"),
    read("scripts/authenticated-dashboard-visual.mjs"),
    read("scripts/vercel-ignore-build.mjs")
  ]);

  assert.match(migration, /interval '30 minutes'/);
  assert.match(migration, /New client request/);
  assert.match(migration, /first_response_due_soon/);
  assert.match(migration, /first_response_overdue/);
  assert.match(migration, /'\*\/5 \* \* \* \*'/);
  assert.match(workflow, /pull_request:/);
  assert.match(workflow, /dashboard-visual/);
  for (const size of ["mobile", "tablet", "desktop"]) assert.match(visual, new RegExp(`name: "${size}"`));
  for (const role of ["recruiter", "client", "va"]) assert.match(visual, new RegExp(`role: "${role}"`));
  assert.match(vercel, /VERCEL_GIT_PULL_REQUEST_ID/);
  assert.match(vercel, /nonRuntimeOnly/);
  assert.match(vercel, /file\.startsWith\("tests\/"\)/);
  assert.match(vercel, /file\.startsWith\("\.github\/"\)/);
  assert.match(vercel, /branch === "main"/);
});
