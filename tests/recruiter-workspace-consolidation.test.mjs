import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy recruiter lead surfaces redirect into the canonical CRM", async () => {
  const [nextConfig, crm, role, closeLead, hiring, crmRecord] = await Promise.all([
    read("next.config.ts"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/actions/close-lead.ts"),
    read("src/app/actions/recruiter-hiring.ts"),
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
  ]);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/leads", destination: "\/workspace\/recruiter\/crm"/);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/leads\/board", destination: "\/workspace\/recruiter\/crm\?mode=board"/);
  assert.match(crm, /"nurture", "all"/);
  assert.match(role, /\/workspace\/recruiter\/crm/);
  assert.match(role, /\/workspace\/client-success\/\$\{room\.id\}/);
  assert.doesNotMatch(role, /\/workspace\/recruiter\/placements\/\$\{room\.id\}/);
  assert.match(closeLead, /\/workspace\/recruiter\/crm/);
  assert.match(hiring, /\/workspace\/recruiter\/crm/);
  assert.match(crmRecord, /createRoleFromLeadAndMatchAction/);
  assert.match(crmRecord, /Create role & open matching/);
});

test("legacy recruiter lead pages are redirect-only compatibility shims", async () => {
  const [legacyList, legacyBoard] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
  ]);

  for (const source of [legacyList, legacyBoard]) {
    assert.match(source, /redirect\(/);
    assert.match(source, /canonicalRecruiterHref/);
    assert.doesNotMatch(source, /createAdminClient|RecruiterLeadKanban|lead_intake|recruiter_leads_page/);
  }

  assert.match(legacyList, /\/workspace\/recruiter\/leads/);
  assert.match(legacyBoard, /\/workspace\/recruiter\/leads\/board/);
});

test("My Day owns the recruiter action surfaces through one tab set", async () => {
  const [tabs, today, tasks, agenda, notifications] = await Promise.all([
    read("src/components/recruiter-operations-nav.tsx"),
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/tasks/page.tsx"),
    read("src/app/workspace/recruiter/agenda/page.tsx"),
    read("src/app/workspace/recruiter/notifications/page.tsx"),
  ]);
  for (const label of ["Today", "Tasks", "This Week", "Inbox"]) assert.match(tabs, new RegExp(label));
  assert.match(today, /RecruiterOperationsNav current="today"/);
  assert.match(tasks, /RecruiterOperationsNav current="tasks"/);
  assert.match(agenda, /RecruiterOperationsNav current="week"/);
  assert.match(notifications, /RecruiterOperationsNav current="notifications"/);
});

test("vetting and dead activity routes collapse into canonical destinations", async () => {
  const [nextConfig, talent] = await Promise.all([
    read("next.config.ts"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
  ]);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/queue", destination: "\/workspace\/recruiter\/talent\?stage=recruiter_review&sort=completion"/);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/activity", destination: "\/workspace\/recruiter\/today"/);
  assert.match(talent, /approve_publish/);
  assert.match(talent, /request_changes/);
  assert.match(talent, /reject/);
});

test("recruiter reporting is one Performance destination while Finance stays operational", async () => {
  const [nav, performance, nextConfig, finance] = await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/performance/page.tsx"),
    read("next.config.ts"),
    read("src/app/workspace/recruiter/finance/page.tsx"),
  ]);
  assert.match(nav, /\["Performance", "\/workspace\/recruiter\/performance"/);
  assert.match(nav, /\["Finance", "\/workspace\/recruiter\/finance"/);
  assert.doesNotMatch(nav, /\["Placements", "\/workspace\/recruiter\/placements"/);
  assert.match(performance, /Analytics/);
  assert.match(performance, /Agency Funnel/);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/funnel", destination: "\/workspace\/recruiter\/performance\?tab=funnel"/);
  assert.match(nextConfig, /source: "\/workspace\/recruiter\/analytics", destination: "\/workspace\/recruiter\/performance\?tab=analytics"/);
  assert.match(finance, /requestMarginExceptionAction/);
});
