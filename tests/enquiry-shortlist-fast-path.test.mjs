import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("public hiring enquiries still create or reuse a linked role", async () => {
  const leads=await read("src/app/actions/leads.ts");
  assert.match(leads,/ensurePendingRoleForLead\(/);
  assert.match(leads,/findRecentDuplicateLead/);
  assert.match(leads,/jobId = await ensurePendingRoleForLead/);
  assert.match(leads,/job_id: jobId/);
});

test("Recruiter My Day surfaces fresh untouched hiring roles before cleanup work", async () => {
  const today=await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(today,/id="new-hiring-enquiries"/);
  assert.match(today,/New hiring enquiries/);
  assert.match(today,/newHiringRoles\.length,title:"Build the first shortlist"/);
  assert.match(today,/!job\.recruiter_id \|\| job\.recruiter_id === userId/);
  assert.match(today,/Prepare top matches/);
  assert.match(today,/prepareTopMatchesForReviewAction/);
});

test("quick shortlist preparation claims an unassigned role and stays internal only", async () => {
  const matching=await read("src/app/actions/matching.ts");
  const start=matching.indexOf("export async function prepareTopMatchesForReviewAction");
  const end=matching.indexOf("export async function saveJobShortlistAction",start);
  assert.ok(start>=0&&end>start);
  const action=matching.slice(start,end);

  assert.match(action,/\.update\(\{ recruiter_id: user\.id \}\)/);
  assert.match(action,/\.update\(\{ owner_id: user\.id \}\)/);
  assert.match(action,/assessment\.eligible !== false && assessment\.score >= 60/);
  assert.match(action,/Math\.max\(0, 3 - existingHuman\.length\)/);
  assert.match(action,/shortlist_status: "proposed"/);
  assert.match(action,/created_by: user\.id/);
  assert.match(action,/internal_only: true/);
  assert.match(action,/shortlist_internal_ready/);
  assert.doesNotMatch(action,/sendTransactionalEventEmail|sendLead|emails\.send|shortlist_status: "released"/);
});

test("role matching explains that quick preparation never sends candidates to the client", async () => {
  const matching=await read("src/components/staff-job-matching.tsx");
  const role=await read("src/app/workspace/recruiter/roles/[id]/page.tsx");
  assert.match(matching,/Fast path: prepare the strongest matches for review/);
  assert.match(matching,/Nothing is emailed or shown to the client until you review the candidates and explicitly send them/);
  assert.match(role,/Nothing was sent to the client/);
});

test("shortlist funnel records internal-ready and sent milestones", async () => {
  const matching=await read("src/app/actions/matching.ts");
  assert.match(matching,/recordProductEvent\("shortlist_internal_ready"/);
  assert.match(matching,/mode === "release" \|\| mode === "invite" \? "shortlist_sent" : "shortlist_internal_ready"/);
});
