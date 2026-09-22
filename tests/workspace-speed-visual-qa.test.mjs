import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("workspace hot routes reuse the fast role session path",async()=>{
  const paths=[
    "src/app/workspace/admin/layout.tsx",
    "src/app/workspace/admin/today/page.tsx",
    "src/app/workspace/admin/funnel/page.tsx",
    "src/app/workspace/admin/finance/page.tsx",
    "src/app/workspace/recruiter/candidates/[id]/page.tsx",
    "src/app/workspace/recruiter/candidates/[id]/screening/page.tsx",
    "src/app/workspace/recruiter/talent/page.tsx",
    "src/app/workspace/client/candidates/page.tsx",
    "src/app/workspace/client/jobs/page.tsx",
    "src/app/workspace/client/jobs/[id]/page.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/requireRoleFast/,`${path} should use requireRoleFast`);
    assert.doesNotMatch(source,/requireRole\("/,`${path} should not trigger the slower getUser auth path`);
  }
});

test("admin navigation badges use one service-only RPC and stay non-blocking",async()=>{
  const [badges,migration,shell]=await Promise.all([
    read("src/lib/workspace-badges.ts"),
    read("supabase/migrations/20260922210500_admin_workspace_badges.sql"),
    read("src/components/app-shell.tsx"),
  ]);
  assert.match(badges,/admin\.rpc\("admin_workspace_badges"\)/);
  assert.doesNotMatch(badges,/marginApprovals/);
  assert.doesNotMatch(badges,/awaitingPayments/);
  assert.match(migration,/revoke all on function public\.admin_workspace_badges\(\) from public/);
  assert.match(migration,/revoke all on function public\.admin_workspace_badges\(\) from authenticated/);
  assert.match(migration,/grant execute on function public\.admin_workspace_badges\(\) to service_role/);
  assert.match(shell,/Suspense fallback={<AppNavLinks role={role}\/>}/);
  assert.match(shell,/WorkspaceNavWithBadges/);
});

test("Today command centers have focused route loading states",async()=>{
  for(const path of [
    "src/app/workspace/recruiter/today/loading.tsx",
    "src/app/workspace/admin/today/loading.tsx",
  ]){
    const source=await read(path);
    assert.match(source,/WorkspaceSkeleton/);
    assert.match(source,/cards=\{4\}/);
  }
});

test("authenticated dashboard visual QA covers current routes, overflow, and first-view actions",async()=>{
  const visual=await read("scripts/authenticated-dashboard-visual.mjs");
  for(const fragment of [
    'path: "/workspace/admin/today", marker: "Owner Command Center", actionSelector: "#owner-actions"',
    'path: "/workspace/recruiter/today", marker: "My Day", actionSelector: "#recruiter-next-action"',
    'path: "/workspace/client", marker: "Your hiring progress", actionSelector: ".workflow-current"',
    'path: "/workspace/va", marker: "What should you do next?", actionSelector: ".dashboard-next-action"',
  ]){
    assert.ok(visual.includes(fragment),`visual QA is missing: ${fragment}`);
  }
  assert.match(visual,/document\.documentElement\.scrollWidth > document\.documentElement\.clientWidth/);
  assert.match(visual,/viewport\.name === "mobile"/);
  assert.match(visual,/mobile primary action starts below the first viewport/);
  assert.match(visual,/width: 390, height: 844/);
  assert.match(visual,/width: 768, height: 1024/);
  assert.match(visual,/width: 1440, height: 1000/);
});
