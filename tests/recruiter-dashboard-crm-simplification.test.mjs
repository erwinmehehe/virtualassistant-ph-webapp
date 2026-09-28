import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter navigation is centered on the hiring workflow", async () => {
  const nav = await read("src/components/app-nav-links.tsx");

  for (const label of ["My Day", "Clients", "Roles", "Talent", "Placements"]) {
    assert.match(nav, new RegExp(`\\["${label}"`));
  }
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
  assert.match(nav, /recruiter: \["\/workspace\/recruiter\/today", "\/workspace\/recruiter\/crm", "\/workspace\/recruiter\/roles", "\/workspace\/recruiter\/talent"\]/);
});

test("Recruiter Today has one next-action layer and no duplicate talent dashboard", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/today/today.module.css"),
  ]);

  assert.match(page, /Work the next action, then clear the queue/);
  assert.match(page, /Needs action/);
  assert.match(page, /Follow-through/);
  assert.doesNotMatch(page, /Talent operations|Four places to look|priorityStrip|Sales cleanup/);
  assert.doesNotMatch(css, /\.operationsGrid|\.signalRow|\.compactPeople|\.priorityStrip|\.workstreamSection|\.workstreamGrid/);
});

test("client CRM defaults to a simple pipeline with fixed views and five useful columns", async () => {
  const page = await read("src/app/workspace/recruiter/crm/page.tsx");

  assert.match(page, /<h1>Client pipeline<\/h1>/);
  assert.match(page, /One client record per hiring request/);
  for (const label of ["Active", "Mine", "Needs action", "Discovery", "Qualified", "Won", "Closed"]) {
    assert.match(page, new RegExp(`"${label}"`));
  }
  assert.match(page, /<th>Client<\/th><th>Stage<\/th><th>Role<\/th><th>Owner<\/th><th>Next step<\/th>/);
  assert.doesNotMatch(page, /Customize dashboard|Save current view|Attio-style|Pipeline value|objectBar/);
});

test("client record prioritizes the hiring workflow and collapses secondary CRM controls", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(page, /Move this hire forward/);
  assert.match(page, /Hiring workflow/);
  for (const label of ["Enquiry", "Call", "Role", "Shortlist", "Interview", "Offer", "Hire"]) {
    assert.match(page, new RegExp(`"${label}"`));
  }
  assert.match(page, /Record settings/);
  assert.match(page, /Activity history/);
  assert.match(page, /Advanced CRM fields/);
  assert.match(page, /Log client interaction/);
  assert.match(page, /\+ Add follow-up task/);
  assert.doesNotMatch(page, /<h2>Relationships<\/h2>|Connected CRM objects|<h2>Next step<\/h2>/);
});
