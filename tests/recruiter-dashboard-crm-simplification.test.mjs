import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter navigation is centered on the hiring workflow", async () => {
  const nav = await read("src/components/app-nav-links.tsx");

  for (const label of ["My Day", "Hiring pipeline", "Roles", "Talent", "Placements"]) {
    assert.match(nav, new RegExp(`\\["${label}"`));
  }
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
  assert.match(nav, /recruiter: \["\/workspace\/recruiter\/today", "\/workspace\/recruiter\/crm", "\/workspace\/recruiter\/roles", "\/workspace\/recruiter\/talent"\]/);
});

test("My Day has one next-action layer instead of duplicate summary dashboards", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css"),
  ]);

  assert.match(page, /Start with the next action/);
  assert.match(page, /Today’s work queue/);
  assert.match(page, /Talent operations/);
  assert.match(page, /Role follow-through/);
  assert.doesNotMatch(page, /Four places to look|priorityStrip|Sales cleanup/);
  assert.doesNotMatch(css, /\.priorityStrip|\.workstreamSection|\.workstreamGrid/);
});

test("Hiring CRM defaults to a simple pipeline with fixed views and five useful columns", async () => {
  const page = await read("src/app/workspace/recruiter/crm/page.tsx");

  assert.match(page, /<h1>Hiring pipeline<\/h1>/);
  assert.match(page, /Enquiry → call → role → shortlist → interview → hire/);
  for (const label of ["Active", "Mine", "Needs action", "Discovery", "Qualified", "Won", "Closed"]) {
    assert.match(page, new RegExp(`"${label}"`));
  }
  assert.match(page, /<th>Client<\/th><th>Stage<\/th><th>Role<\/th><th>Owner<\/th><th>Next step<\/th>/);
  assert.doesNotMatch(page, /Customize dashboard|Save current view|Attio-style|Pipeline value/);
});

test("CRM record keeps advanced controls collapsed and prioritizes next step", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(page, /<h2>Next actions<\/h2>/);
  assert.match(page, /<h2>Next step<\/h2>/);
  assert.match(page, /Activity history/);
  assert.match(page, /Advanced CRM fields/);
  assert.match(page, /Log client interaction/);
  assert.match(page, /\+ Add follow-up task/);
  assert.doesNotMatch(page, /<h2>Dates<\/h2>|<h2>Properties<\/h2>|Action center/);
});
