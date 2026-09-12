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
