import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("owner command center is a real admin today route",async()=>{
  const page=await read("src/app/workspace/admin/today/page.tsx");
  assert.match(page,/Owner Command Center/);
  assert.match(page,/What needs you now/);
  assert.match(page,/Lead → revenue → retention/);
  assert.match(page,/New leads/);
  assert.match(page,/Calls today/);
  assert.match(page,/Proposals/);
  assert.match(page,/Open roles/);
  assert.match(page,/Shortlists/);
  assert.match(page,/Placements/);
  assert.match(page,/Collections/);
  assert.match(page,/Retention risks/);
  assert.match(page,/Hiring Rooms waiting/);
  assert.match(page,/Renewals in 30 days/);
});

test("owner command center never sends admin into recruiter-only routes",async()=>{
  const page=await read("src/app/workspace/admin/today/page.tsx");
  assert.doesNotMatch(page,/\/workspace\/recruiter\//);
  assert.match(page,/\/workspace\/admin\/leads\?view=hiring/);
  assert.match(page,/\/workspace\/admin\/jobs\//);
  assert.match(page,/\/workspace\/client-success\//);
});

test("admin hiring oversight can search an exact lead and send tracked follow-up",async()=>{
  const page=await read("src/app/workspace/admin/leads/page.tsx");
  assert.match(page,/recruiterCleanupLeadAction/);
  assert.match(page,/Send tracked follow-up/);
  assert.match(page,/Follow up in 3 days/);
  assert.match(page,/UUID\.test\(q\)/);
  assert.match(page,/\/workspace\/admin\/jobs\//);
  assert.doesNotMatch(page,/Open recruiter role/);
});

test("authenticated sidebar removes the redundant current workspace card",async()=>{
  const shell=await read("src/components/app-shell.tsx");
  assert.match(shell,/workspaceHome/);
  assert.match(shell,/recruiter:\s*"\/workspace\/recruiter"/);
  assert.match(shell,/admin:\s*"\/workspace\/admin\/today"/);
  assert.doesNotMatch(shell,/className="app-workspace-card"/);
  assert.doesNotMatch(shell,/Current workspace/);
});

test("recruiter overview and owner today are discoverable from navigation",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/\["Overview", "\/workspace\/recruiter", LayoutDashboard\]/);
  assert.match(nav,/\["Today", "\/workspace\/admin\/today", ListTodo\]/);
});


test("owner command center filters stale closed-role signals",async()=>{
  const page=await read("src/app/workspace/admin/today/page.tsx");
  assert.match(page,/jobs!inner\(title,company_name,status\)/);
  assert.match(page,/\.in\("jobs\.status",\["pending","published"\]\)/);
  assert.match(page,/\["closed","draft"\]\.includes\(jobStatus\)/);
  assert.match(page,/shortlist\|client response/);
});

test("closed hiring leads never show follow-up actions",async()=>{
  const page=await read("src/app/workspace/admin/leads/page.tsx");
  assert.match(page,/CLOSED_HIRING_STAGES/);
  assert.match(page,/hiringOpen\(lead\)\?/);
  assert.match(page,/Closed lead · no follow-up action/);
});
