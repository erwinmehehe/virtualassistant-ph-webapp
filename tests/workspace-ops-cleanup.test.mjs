import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("frequent workspace GET pages use fast verified role guards",async()=>{
  const paths=[
    "src/app/workspace/recruiter/activity/page.tsx",
    "src/app/workspace/recruiter/analytics/page.tsx",
    "src/app/workspace/recruiter/finance/page.tsx",
    "src/app/workspace/recruiter/funnel/page.tsx",
    "src/app/workspace/recruiter/queue/page.tsx",
    "src/app/workspace/recruiter/work-readiness/page.tsx",
    "src/app/workspace/admin/analytics/page.tsx",
    "src/app/workspace/admin/audit/page.tsx",
    "src/app/workspace/admin/email-health/page.tsx",
    "src/app/workspace/admin/health/page.tsx",
    "src/app/workspace/admin/jobs/page.tsx",
    "src/app/workspace/admin/leads/page.tsx",
    "src/app/workspace/admin/moderation/page.tsx",
    "src/app/workspace/admin/payments/page.tsx",
    "src/app/workspace/admin/users/page.tsx",
    "src/app/workspace/client/candidates/[id]/page.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/require(?:Any)?RoleFast/,`${path} should use the verified fast auth path`);
    assert.doesNotMatch(source,/require(?:Any)?Role\("/,`${path} should not call the slower user-record guard`);
  }
});

test("legacy recruiter matching list redirects into canonical Roles",async()=>{
  const [matching,activity,nav]=await Promise.all([
    read("src/app/workspace/recruiter/matching/page.tsx"),
    read("src/app/workspace/recruiter/activity/page.tsx"),
    read("src/components/app-nav-links.tsx"),
  ]);
  assert.match(matching,/LEGACY_VIEW_MAP/);
  assert.match(matching,/waiting_client: "waiting_client"/);
  assert.match(matching,/redirect\(\`\/workspace\/recruiter\/roles\?view=\$\{view\}&sort=\$\{sort\}\`\)/);
  assert.doesNotMatch(activity,/href="\/workspace\/recruiter\/matching"/);
  assert.match(activity,/href="\/workspace\/recruiter\/roles\?view=needs_candidates&sort=urgent"/);
  for(const label of ["Bench","Stalled","Categories","Queue"]){
    assert.doesNotMatch(nav,new RegExp(`\\["${label}",`));
  }
});

test("internal talent and user lists display saved profile photos",async()=>{
  const [readiness,queue,users]=await Promise.all([
    read("src/app/workspace/recruiter/work-readiness/page.tsx"),
    read("src/app/workspace/recruiter/queue/page.tsx"),
    read("src/app/workspace/admin/users/page.tsx"),
  ]);
  for(const source of [readiness,queue,users]){
    assert.match(source,/PublicAvatar/);
    assert.match(source,/avatar_url/);
  }
  assert.match(users,/select\("id,role,full_name,avatar_url,/);
});

test("heavy recruiter and admin routes have focused loading states",async()=>{
  const paths=[
    "src/app/workspace/recruiter/work-readiness/loading.tsx",
    "src/app/workspace/recruiter/funnel/loading.tsx",
    "src/app/workspace/recruiter/analytics/loading.tsx",
    "src/app/workspace/admin/funnel/loading.tsx",
    "src/app/workspace/admin/analytics/loading.tsx",
    "src/app/workspace/admin/users/loading.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/WorkspaceSkeleton/);
    assert.match(source,/cards=\{4\}/);
  }
});

test("work readiness and funnel remain mobile first",async()=>{
  const css=await read("src/app/workspace/recruiter-ops-clarity.css");
  assert.match(css,/\.recruiter-readiness-summary[\s\S]{0,120}repeat\(3, minmax\(0, 1fr\)\)/);
  assert.match(css,/\.recruiter-readiness-summary > a\.is-ready/);
  assert.match(css,/\.recruiter-readiness-summary > a\.is-incomplete/);
  assert.match(css,/\.recruiter-readiness-summary > a\.is-overdue/);
  assert.match(css,/\.agency-funnel-step\.is-dropoff/);
  assert.match(css,/\.agency-sales-summary/);
  assert.match(css,/@media \(max-width: 680px\)[\s\S]*\.recruiter-readiness-tabs[\s\S]*overflow-x: auto/);
});
