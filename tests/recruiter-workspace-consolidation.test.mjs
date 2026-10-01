import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("legacy recruiter lead surfaces redirect into the canonical CRM", async () => {
  const [leads, board, crm, role, closeLead, hiring] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
    read("src/app/workspace/recruiter/crm/page.tsx"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/actions/close-lead.ts"),
    read("src/app/actions/recruiter-hiring.ts"),
  ]);
  assert.match(leads, /\/workspace\/recruiter\/crm/);
  assert.match(board, /mode=board/);
  assert.match(crm, /"nurture", "all"/);
  for (const source of [role, closeLead, hiring]) {
    assert.doesNotMatch(source, /\/workspace\/recruiter\/leads/);
    assert.match(source, /\/workspace\/recruiter\/crm/);
  }
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
  const [queue, activity, talent] = await Promise.all([
    read("src/app/workspace/recruiter/queue/page.tsx"),
    read("src/app/workspace/recruiter/activity/page.tsx"),
    read("src/app/workspace/recruiter/talent/page.tsx"),
  ]);
  assert.match(queue, /talent\?stage=recruiter_review&sort=completion/);
  assert.match(activity, /redirect\("\/workspace\/recruiter\/today"\)/);
  assert.match(talent, /approve_publish/);
  assert.match(talent, /request_changes/);
  assert.match(talent, /reject/);
});

test("recruiter reporting is one Performance destination while Finance stays operational", async () => {
  const [nav, performance, funnelRedirect, analyticsRedirect, finance] = await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/performance/page.tsx"),
    read("src/app/workspace/recruiter/funnel/page.tsx"),
    read("src/app/workspace/recruiter/analytics/page.tsx"),
    read("src/app/workspace/recruiter/finance/page.tsx"),
  ]);
  assert.match(nav, /\["Performance", "\/workspace\/recruiter\/performance"/);
  assert.match(nav, /\["Finance", "\/workspace\/recruiter\/finance"/);
  assert.doesNotMatch(nav, /\["Placements", "\/workspace\/recruiter\/placements"/);
  assert.match(performance, /Analytics/);
  assert.match(performance, /Agency Funnel/);
  assert.match(funnelRedirect, /tab: "funnel"/);
  assert.match(analyticsRedirect, /tab: "analytics"/);
  assert.match(finance, /requestMarginExceptionAction/);
});
