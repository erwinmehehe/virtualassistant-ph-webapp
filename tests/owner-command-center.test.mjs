import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("owner command center is a real admin today route",async()=>{
  const page=await read("src/app/workspace/admin/today/page.tsx");
  assert.match(page,/Owner Command Center/);
  assert.match(page,/What needs you now/);
  assert.match(page,/Discovery calls today/);
  assert.match(page,/At-risk placements/);
  assert.match(page,/Overdue collections/);
  assert.match(page,/Hiring Rooms waiting/);
  assert.match(page,/Renewals in 30 days/);
});

test("current workspace card links back to each workspace home",async()=>{
  const shell=await read("src/components/app-shell.tsx");
  assert.match(shell,/workspaceHome/);
  assert.match(shell,/recruiter:\s*"\/workspace\/recruiter"/);
  assert.match(shell,/admin:\s*"\/workspace\/admin\/today"/);
  assert.match(shell,/className="app-workspace-card"/);
});

test("recruiter overview and owner today are discoverable from navigation",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/\["Overview", "\/workspace\/recruiter", LayoutDashboard\]/);
  assert.match(nav,/\["Today", "\/workspace\/admin\/today", ListTodo\]/);
});
