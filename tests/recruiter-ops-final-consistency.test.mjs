import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL("../"+path,import.meta.url),"utf8");

test("Work Readiness keeps one fast queue and three obvious priority states",async()=>{
  const [page,loader]=await Promise.all([
    read("src/app/workspace/recruiter/work-readiness/page.tsx"),
    read("src/lib/work-readiness-queue.ts"),
  ]);
  assert.match(page,/requireAnyRoleFast\(\["recruiter", "admin"\]\)/);
  assert.match(page,/getWorkReadinessQueue\(userId\)/);
  assert.doesNotMatch(page,/createAdminClient/);
  for(const label of ["Ready to verify","Incomplete","Overdue"]){
    assert.match(page,new RegExp(label));
  }
  assert.match(page,/Missing evidence/);
  assert.match(loader,/admin\.rpc\("work_readiness_queue"/);
  assert.match(loader,/withServerTiming\("recruiter\.work_readiness"/);
});

test("Agency Funnel is sales-first and separates operations",async()=>{
  const component=await read("src/components/agency-funnel-dashboard.tsx");
  for(const label of ["Leads","Calls booked","Qualified","Proposals","Clients won"]){
    assert.match(component,new RegExp(`label:"${label}"`));
  }
  assert.match(component,/conversion=previous\?percent\(stage\.value,previous\.value\):null/);
  assert.match(component,/Biggest drop-off/);
  assert.match(component,/Delivery operations/);
  assert.match(component,/Retention operations/);
  assert.match(component,/These are not sales conversion stages/);
});

test("frequent Client and VA pages use the verified fast role path",async()=>{
  const paths=[
    "src/app/workspace/client/team/page.tsx",
    "src/app/workspace/client/support/page.tsx",
    "src/app/workspace/va/workroom/page.tsx",
    "src/app/workspace/va/interviews/page.tsx",
    "src/app/workspace/va/offers/page.tsx",
    "src/app/workspace/va/notifications/page.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/requireRoleFast/,`${path} should use requireRoleFast`);
    assert.doesNotMatch(source,/requireRole\("/,`${path} should not perform slow user-record auth`);
  }
});

test("Client Team uses the shared profile-photo component",async()=>{
  const page=await read("src/app/workspace/client/team/page.tsx");
  assert.match(page,/import \{ PublicAvatar \} from "@\/components\/public-avatar"/);
  assert.match(page,/<PublicAvatar name=\{va\.full_name\|\|"Virtual Assistant"\} src=\{va\.avatar_url\} size="sm"\/>/);
  assert.doesNotMatch(page,/<img src=\{va\.avatar_url\}/);
});

test("desktop navigation does not duplicate the account card while mobile keeps account access",async()=>{
  const nav=await read("src/components/app-nav-links.tsx");
  assert.match(nav,/const desktopGroups = groups\.map/);
  assert.match(nav,/href !== "\/workspace\/account"/);
  assert.match(nav,/\{desktopGroups\.map\(\(group\) => \(/);
  assert.match(nav,/const secondaryGroups = groups/);
  assert.match(nav,/\["Account settings", "\/workspace\/account", Settings\]/);
});

test("heavy recruiter and admin routes have focused loading states",async()=>{
  const paths=[
    "src/app/workspace/recruiter/roles/loading.tsx",
    "src/app/workspace/recruiter/finance/loading.tsx",
    "src/app/workspace/admin/sales/loading.tsx",
    "src/app/workspace/admin/finance/loading.tsx",
    "src/app/workspace/admin/jobs/loading.tsx",
  ];
  for(const path of paths){
    const source=await read(path);
    assert.match(source,/WorkspaceSkeleton/);
    assert.match(source,/cards=\{4\}/);
  }
});
