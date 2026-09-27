import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter role control center does not ask staff to invent missing lead fields", async () => {
  const page=await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  assert.doesNotMatch(page,/RoleReadinessForm/);
  assert.doesNotMatch(page,/saveRoleReadinessDetailsAction/);
  assert.doesNotMatch(page,/requestClientRoleDetailsAction/);
  assert.doesNotMatch(page,/Complete role details/);
  assert.doesNotMatch(page,/#role-readiness/);
  assert.doesNotMatch(page,/role_details_saved|role_details_requested|role_details_error/);
});

test("lead-created roles are not blocked by fields the public lead forms do not consistently collect", async () => {
  const publication=await read("src/lib/job-publication.ts");
  const fn=publication.slice(
    publication.indexOf("export function publicationMissingDetails"),
    publication.indexOf("export function publicationBlocker"),
  );
  assert.doesNotMatch(fn,/missing\.push\("skills"\)/);
  assert.doesNotMatch(fn,/missing\.push\("timezone"\)/);
  assert.doesNotMatch(fn,/missing\.push\("start timing"\)/);
  for (const required of ["title","summary","responsibilities","hours","budget"]) {
    assert.match(fn,new RegExp(`missing\\.push\\("${required}"\\)`));
  }
});

test("Hiring inbox sends linked roles into the actual hiring workflow, not a dead completion form", async () => {
  const page=await read("src/app/workspace/recruiter/leads/page.tsx");
  assert.doesNotMatch(page,/publicationMissingDetails/);
  assert.doesNotMatch(page,/complete_role/);
  assert.doesNotMatch(page,/#role-readiness/);
  assert.match(page,/\/workspace\/recruiter\/roles\/\$\{lead\.job_id\}#matching/);
});
