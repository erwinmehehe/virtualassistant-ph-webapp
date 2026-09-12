import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("homepage keeps one compact hiring form in the hero", async () => {
  const [page, css] = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/premium-home.css")
  ]);

  assert.match(page, /id="hero-hiring-form"/);
  assert.equal((page.match(/<RoleBriefForm/g) || []).length, 1);
  assert.doesNotMatch(page, /pva-workflow-card/);
  assert.match(page, /href="#hero-hiring-form"/);
  assert.match(css, /\.pva-hero-form-shell/);
  assert.match(css, /padding: clamp\(3rem, 5vw, 4\.5rem\)/);
});

test("large page styles are scoped to their route", async () => {
  const [rootLayout, home, hire, workspace] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/app/page.tsx"),
    read("src/app/hire/page.tsx"),
    read("src/app/workspace/layout.tsx")
  ]);

  assert.doesNotMatch(rootLayout, /premium-home\.css|premium-hire\.css|dashboard-premium\.css/);
  assert.match(home, /premium-home\.css/);
  assert.match(hire, /premium-hire\.css/);
  assert.match(workspace, /dashboard-premium\.css/);
});

test("dashboard overview payloads use compact RPC fast paths", async () => {
  const [client, recruiter, migration] = await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/recruiter/page.tsx"),
    read("supabase/migrations/20260912121500_dashboard_payload_optimization.sql")
  ]);

  assert.match(client, /getClientDashboardSummary\(user\.id\)/);
  assert.doesNotMatch(client, /from\("applications"\)|from\("workrooms"\)/);
  assert.match(recruiter, /recruiter_dashboard_vetting_queue/);
  assert.match(recruiter, /recruiter_dashboard_roles_needing_matching/);
  assert.match(migration, /client_dashboard_summary/);
});

test("workspace Core Web Vitals are recorded", async () => {
  const [analytics, route] = await Promise.all([
    read("src/components/analytics.tsx"),
    read("src/app/api/analytics/route.ts")
  ]);

  assert.match(analytics, /useReportWebVitals\(reportWorkspaceVital\)/);
  assert.match(analytics, /startsWith\("\/workspace"\)/);
  assert.match(route, /"web_vital"/);
});

test("conversion analytics accepts and reports the complete homepage funnel", async () => {
  const [analytics, route, sales, dashboard, migration] = await Promise.all([
    read("src/components/analytics.tsx"),
    read("src/app/api/analytics/route.ts"),
    read("src/lib/sales-analytics.ts"),
    read("src/components/sales-analytics-dashboard.tsx"),
    read("supabase/migrations/20260912231500_lead_response_sla_and_conversion.sql")
  ]);

  for (const event of ["page_view", "form_start", "form_submit_attempt", "booking_click"]) {
    assert.match(route, new RegExp(`"${event}"`));
  }
  assert.match(analytics, /send\("form_start"/);
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
  assert.match(vercel, /documentationOnly/);
});
