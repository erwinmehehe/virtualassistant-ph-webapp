import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { pendingJobRequests } from "../src/lib/recruiter-job-requests.ts";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("team pending queue includes requests from all recruiter assignments, excluding drafts and public roles", () => {
  const rows = [
    {id:"a",status:"pending",hiring_stage:"intake",created_at:"2026-10-15T10:00:00Z",recruiter_id:"recruiter-a",client_id:"client-a"},
    {id:"b",status:"pending",hiring_stage:"ready_to_recruit",created_at:"2026-10-15T11:00:00Z",recruiter_id:"recruiter-b",client_id:"client-b"},
    {id:"c",status:"pending",hiring_stage:"ready_to_recruit",created_at:"2026-10-15T12:00:00Z",recruiter_id:null,client_id:"client-c"},
    {id:"draft",status:"draft",hiring_stage:"intake",created_at:"2026-10-15T08:00:00Z",recruiter_id:"recruiter-a",client_id:"client-d"},
    {id:"public",status:"published",hiring_stage:"sourcing",created_at:"2026-10-15T09:00:00Z",recruiter_id:"recruiter-c",client_id:"client-e"},
    {id:"filled",status:"pending",hiring_stage:"filled",created_at:"2026-10-15T07:00:00Z",recruiter_id:"recruiter-c",client_id:"client-f"},
  ];
  assert.deepEqual(pendingJobRequests(rows).map((x)=>x.id),["a","b","c"]);
});

test("team pending data is fetched only for active recruiters, without widening database grants", async () => {
  const source = await read("src/lib/recruiter-team-job-requests.ts");
  assert.match(source,/import "server-only"/);
  assert.match(source,/requireRoleFast\("recruiter"\)/);
  assert.match(source,/profile\.account_status !== "active"/);
  assert.ok(source.indexOf('requireRoleFast("recruiter")') < source.indexOf('createAdminClient()'));
  assert.match(source,/\.from\("jobs"\)/);
  assert.match(source,/\.eq\("status", "pending"\)/);
  assert.match(source,/\.select\("id,title,company_name,status,hiring_stage,created_at,recruiter_id,client_id"/);
  assert.doesNotMatch(source,/\.eq\("recruiter_id"/);
  assert.doesNotMatch(source,/\.select\("\*"/);
});

test("recruiter Today and Roles show team requests but preserve assigned-only active pipeline", async () => {
  const [today,roles,rpc] = await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("src/app/workspace/recruiter/roles/page.tsx"),
    read("src/lib/recruiter-roles-summary.ts"),
  ]);
  assert.match(today,/const pendingRequests = teamJobRequests\.jobs/);
  assert.match(roles,/const requests=teamJobRequests\.jobs/);
  assert.match(today,/Job requests awaiting review/);
  assert.match(roles,/teamRequestRows\.map/);
  assert.match(today,/\/workspace\/recruiter\/roles\/\$\{request\.id\}#overview/);
  assert.match(roles,/href=\{"\/workspace\/recruiter\/roles\/" \+ request\.id \+ "#overview"\}/);
  assert.match(rpc,/admin\.rpc\("recruiter_roles_summary"/);
  assert.match(roles,/const open=jobs\.filter/);
  assert.doesNotMatch(today,/pendingJobRequests\(roleSummary\.data\.jobs\)/);
  assert.doesNotMatch(roles,/pendingJobRequests\(open\)/);
});
