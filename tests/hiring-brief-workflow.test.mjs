import test from "node:test";
import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("role readiness workflow is removed from staff and client hiring surfaces", async () => {
  const paths=[
    "src/app/workspace/recruiter/today/page.tsx",
    "src/app/workspace/recruiter/roles/page.tsx",
    "src/app/workspace/recruiter/roles/[id]/page.tsx",
    "src/app/workspace/admin/today/page.tsx",
    "src/app/workspace/admin/jobs/page.tsx",
    "src/app/workspace/admin/jobs/[id]/page.tsx",
    "src/app/workspace/client/jobs/[id]/page.tsx",
    "src/app/actions/agency-role.ts",
    "src/app/actions/jobs.ts",
  ];
  const sources=await Promise.all(paths.map(read));
  for(const source of sources){
    assert.doesNotMatch(source,/RoleReadiness|role-readiness|role_readiness|role_details_requested|role_details_saved|role_details_error|needs_details|Missing role details|Complete required hiring details/);
  }
});

test("obsolete role readiness modules no longer exist", async () => {
  for(const path of [
    "src/components/role-readiness-form.tsx",
    "src/lib/role-readiness-dashboard.ts",
    "src/lib/role-readiness-policy.ts",
  ]){
    await assert.rejects(access(new URL(`../${path}`,import.meta.url)));
  }
});

test("publication validation only blocks on core public brief content", async () => {
  const helper=await read("src/lib/job-publication.ts");
  const fn=helper.slice(
    helper.indexOf("export function publicationMissingDetails"),
    helper.indexOf("export function publicationBlocker"),
  );
  for(const required of ["title","summary","responsibilities","budget"]){
    assert.match(fn,new RegExp(`missing\\.push\\("${required}"\\)`));
  }
  for(const optional of ["skills","timezone","start timing","hours"]){
    assert.doesNotMatch(fn,new RegExp(`missing\\.push\\("${optional}"\\)`));
  }
  assert.match(helper,/label: "Brief incomplete"/);
});
