import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("recruiter navigation is centered on the hiring workflow", async () => {
  const nav = await read("src/components/app-nav-links.tsx");

  for (const label of ["My Day", "Clients", "Discovery", "Client messages", "VA messages", "Roles", "Talent", "Performance", "Finance"]) {
    assert.match(nav, new RegExp(`\\["${label}"`));
  }
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
  assert.doesNotMatch(nav, /\["Placements", "\/workspace\/recruiter\/placements"/);
  assert.doesNotMatch(nav, /\["Agency Funnel", "\/workspace\/recruiter\/funnel"/);
  assert.doesNotMatch(nav, /\["Recruiting Analytics", "\/workspace\/recruiter\/analytics"/);
  assert.match(nav, /recruiter: \["\/workspace\/recruiter\/today", "\/workspace\/recruiter\/crm", "\/workspace\/recruiter\/messages", "\/workspace\/recruiter\/roles"\]/);
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

test("client CRM defaults to a simple pipeline with fixed views and focused activity columns", async () => {
  const page = await read("src/app/workspace/recruiter/crm/page.tsx");

  assert.match(page, /<h1>Client pipeline<\/h1>/);
  assert.match(page, /One client record per hiring request/);
  for (const label of ["Active", "Mine", "Needs action", "Discovery", "Qualified", "Won", "Closed"]) {
    assert.match(page, new RegExp(`"${label}"`));
  }
  assert.match(page, /<th aria-label="Select"><\/th><th>Client<\/th><th>Stage<\/th><th>Role<\/th><th>Client activity<\/th><th>Owner<\/th><th>Next step<\/th>/);
  assert.match(page, /VA views/);
  assert.doesNotMatch(page, /Account-wide/);
  assert.doesNotMatch(page, /Customize dashboard|Save current view|Attio-style|Pipeline value|objectBar/);
});

test("client record prioritizes the hiring workflow and collapses secondary CRM controls", async () => {
  const page = await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");

  assert.match(page, /Move this hire forward/);
  assert.match(page, /Hiring workflow/);
  for (const label of ["Enquiry", "Discovery", "Proposal", "Shortlist", "Interview", "Offer", "Hire"]) {
    assert.match(page, new RegExp(`"${label}"`));
  }
  assert.match(page, /Record settings/);
  assert.match(page, /Activity history/);
  assert.match(page, /Advanced CRM fields/);
  assert.match(page, /Log client interaction/);
  assert.match(page, /\+ Add follow-up task/);
  assert.doesNotMatch(page, /<h2>Relationships<\/h2>|Connected CRM objects|<h2>Next step<\/h2>/);
});


test("legacy recruiter lead routes collapse into the canonical CRM pipeline", async () => {
  const [leadsPage, boardPage, routes, funnel] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
    read("src/lib/recruiter-routes.ts"),
    read("src/app/workspace/recruiter/funnel/page.tsx"),
  ]);

  assert.match(leadsPage, /canonicalRecruiterHref/);
  assert.match(boardPage, /canonicalRecruiterHref/);
  assert.match(leadsPage, /redirect\(canonicalRecruiterHref\(legacyHref, "\/workspace\/recruiter\/crm"/);
  assert.match(boardPage, /redirect\(canonicalRecruiterHref\(legacyHref, "\/workspace\/recruiter\/crm\?mode=board"/);
  assert.match(routes, /originalPath === "\/workspace\/recruiter\/leads"/);
  assert.match(routes, /originalPath === "\/workspace\/recruiter\/leads\/board"/);
  assert.match(funnel, /leadsPath="\/workspace\/recruiter\/crm"/);
  assert.doesNotMatch(funnel, /leadsPath="\/workspace\/recruiter\/leads"/);
});
