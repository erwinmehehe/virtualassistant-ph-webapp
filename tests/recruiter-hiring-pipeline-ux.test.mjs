import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter navigation keeps the CRM inside the connected hiring workflow", async () => {
  const [nav, board] = await Promise.all([
    read("src/components/app-nav-links.tsx"),
    read("src/app/workspace/recruiter/leads/board/page.tsx"),
  ]);

  for (const label of ["CRM", "Active roles", "Client review", "Placements", "Talent"]) {
    assert.match(nav, new RegExp(`\\["${label}"`));
  }
  assert.match(nav, /recruiter: \\["\\/workspace\\/recruiter\\/today", "\\/workspace\\/recruiter\\/crm", "\\/workspace\\/recruiter\\/roles", "\\/workspace\\/recruiter\\/client-review"\\]/);
  assert.doesNotMatch(board, /kicker="Sales CRM"/);
  assert.match(board, /kicker="Hiring Pipeline"/);
  assert.match(board, /title="Employer pipeline"/);
});

test("Hiring inbox shows one connected lead-to-hire workflow and one primary next action", async () => {
  const [page, css] = await Promise.all([
    read("src/app/workspace/recruiter/leads/page.tsx"),
    read("src/app/workspace/recruiter/leads/leads.module.css"),
  ]);

  assert.match(page, /crm-hiring-flow-nav/);
  assert.match(page, /Hiring inbox[\s\S]*Active roles[\s\S]*Client review[\s\S]*Placements/);
  assert.match(page, /HIRING_FLOW_STEPS = \["Enquiry", "Role", "Matching", "Client review", "Interview", "Offer", "Hire"\]/);
  assert.match(page, /crm-hiring-next/);
  assert.match(page, /Next hiring action/);
  assert.match(page, /hiringActionKind === "create_role"/);
  assert.doesNotMatch(page, /complete_role|#role-readiness/);
  assert.match(page, /#client-handoff/);
  assert.match(page, /#interviews/);
  assert.match(page, /#matching/);
  assert.match(page, /Client email is intentionally held until recruiter-reviewed VAs are ready/);
  assert.match(css, /\.crmPage :global\(\.crm-hiring-flow-nav\)/);
  assert.match(css, /\.crmPage :global\(\.crm-hiring-next\)/);
  assert.match(css, /\.crmPage :global\(\.crm-hiring-progress\)/);
});

test("role bridge keeps the role visible but does not compete with the primary next action", async () => {
  const page = await read("src/app/workspace/recruiter/leads/page.tsx");

  assert.match(page, /crm-role-bridge/);
  assert.match(page, />Open role<\/Link>/);
  const roleBridgeStart = page.indexOf('className={\`crm-role-bridge');
  const contactBarStart = page.indexOf('className="crm-contact-bar"');
  const region = page.slice(roleBridgeStart, contactBarStart);
  assert.doesNotMatch(region, /Create role &amp; start matching<\/button>/);
});
