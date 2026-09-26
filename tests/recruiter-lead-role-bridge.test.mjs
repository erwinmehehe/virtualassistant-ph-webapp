import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("recruiter can prepare a missing hiring role and open matching without duplicating job logic",async()=>{
  const [action,helper,page]=await Promise.all([
    read("src/app/actions/recruiter-hiring.ts"),
    read("src/lib/lead-role.ts"),
    read("src/app/workspace/recruiter/leads/page.tsx")
  ]);

  assert.match(action,/requireRole\("recruiter"\)/);
  assert.match(action,/lead_type/);
  assert.match(action,/client_hiring/);
  assert.match(action,/ensurePendingRoleForLead/);
  assert.match(action,/recruiterId: user\.id/);
  assert.match(action,/ownerId: user\.id/);
  assert.match(action,/writeRecruiterActivity/);
  assert.match(action,/source: "hiring_inbox"/);
  assert.match(action,/redirect\(`\/workspace\/recruiter\/roles\/\$\{jobId\}#matching`\)/);
  assert.doesNotMatch(action,/\.from\("jobs"\)[\s\S]*\.insert\(/);
  assert.match(helper,/\.is\("owner_id", null\)/);
  assert.match(action,/role_error=/);
  assert.match(page,/params\.role_error/);
});
