import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("remaining common workspace GET pages use fast verified auth",async()=>{
  const paths=[
    "src/app/workspace/admin/settings/page.tsx",
    "src/app/workspace/admin/system/page.tsx",
    "src/app/workspace/admin/vetting/page.tsx",
    "src/app/workspace/admin/account-deletion-requests/page.tsx",
    "src/app/workspace/client/company/page.tsx",
    "src/app/workspace/client/interviews/page.tsx",
    "src/app/workspace/client/offers/page.tsx",
    "src/app/workspace/client/notifications/page.tsx",
    "src/app/workspace/va/applications/page.tsx",
    "src/app/workspace/va/jobs/page.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/require(?:Any)?RoleFast/,`${path} should use fast auth`);
    assert.doesNotMatch(source,/require(?:Any)?Role\("/,`${path} should not use the slower user-record guard`);
  }
});

test("internal admin people queues show saved profile photos",async()=>{
  const [vetting,deletions]=await Promise.all([
    read("src/app/workspace/admin/vetting/page.tsx"),
    read("src/app/workspace/admin/account-deletion-requests/page.tsx"),
  ]);
  for(const source of [vetting,deletions]){
    assert.match(source,/PublicAvatar/);
    assert.match(source,/avatar_url/);
  }
  assert.match(vetting,/select\("id,full_name,avatar_url"\)/);
  assert.match(deletions,/select\("id,full_name,role,avatar_url"\)/);
});

test("remaining heavy recruiter and admin queues have focused loading states",async()=>{
  for(const path of [
    "src/app/workspace/recruiter/leads/loading.tsx",
    "src/app/workspace/recruiter/talent/loading.tsx",
    "src/app/workspace/admin/vetting/loading.tsx",
  ]){
    const source=await read(path);
    assert.match(source,/WorkspaceSkeleton/);
    assert.match(source,/cards=\{4\}/);
  }
});

test("primary recruiter navigation stays consolidated",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  for(const label of ["Matching","Bench","Stalled","Categories","Queue"]){
    assert.doesNotMatch(nav,new RegExp(`\\["${label}",`));
  }
  for(const label of ["My Day","Hiring inbox","Active roles","Talent","Work Readiness","Agency Funnel"]){
    assert.match(nav,new RegExp(`\\["${label}",`));
  }
});


test("content security policy permits the existing GA4 integration",async()=>{
  const config=await read("next.config.ts");
  assert.match(config,/script-src[^"]*https:\/\/www\.googletagmanager\.com/);
  assert.match(config,/connect-src[^"]*https:\/\/www\.google-analytics\.com/);
  assert.match(config,/connect-src[^"]*https:\/\/\*\.google-analytics\.com/);
  assert.match(config,/https:\/\/challenges\.cloudflare\.com/);
});
