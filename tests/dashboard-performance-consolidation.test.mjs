import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("staff landing dashboards use one compact summary RPC each",async()=>{
  const [recruiter,admin]=await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/admin/today/page.tsx")
  ]);
  assert.match(recruiter,/rpc\("recruiter_today_summary"/);
  assert.equal((recruiter.match(/\.rpc\(/g)||[]).length,1);
  assert.doesNotMatch(recruiter,/\.from\("/);

  assert.match(admin,/rpc\("admin_today_summary"/);
  assert.equal((admin.match(/\.rpc\(/g)||[]).length,1);
  assert.doesNotMatch(admin,/\.from\("/);
  assert.doesNotMatch(admin,/\.limit\(250\)/);
});

test("client and VA homes retain their existing summary fast paths",async()=>{
  const [client,va]=await Promise.all([
    read("src/app/workspace/client/page.tsx"),
    read("src/app/workspace/va/page.tsx")
  ]);
  assert.match(client,/getClientDashboardSummary\(userId\)/);
  assert.match(va,/getVaDashboardSummary\(userId\)/);
  assert.doesNotMatch(va,/createAdminClient/);
});

test("recruiter overview is consolidated into My Day",async()=>{
  const [root,nav,shell]=await Promise.all([
    read("src/app/workspace/recruiter/page.tsx"),
    read("src/components/app-nav-links.tsx"),
    read("src/components/app-shell.tsx")
  ]);
  assert.match(root,/redirect\("\/workspace\/recruiter\/today"\)/);
  assert.doesNotMatch(nav,/\["Overview", "\/workspace\/recruiter"/);
  assert.match(shell,/recruiter:\s*"\/workspace\/recruiter\/today"/);
});
