import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const recruiterTalentAction = fs.readFileSync("src/app/actions/recruiter-talent.ts", "utf8");
const matching = fs.readFileSync("src/components/staff-job-matching.tsx", "utf8");
const clientJob = fs.readFileSync("src/app/workspace/client/jobs/[id]/page.tsx", "utf8");
const clientCandidates = fs.readFileSync("src/app/workspace/client/candidates/page.tsx", "utf8");
const clientCandidate = fs.readFileSync("src/app/workspace/client/candidates/[id]/page.tsx", "utf8");
const compare = fs.readFileSync("src/app/workspace/client/compare/page.tsx", "utf8");
const applicationActions = fs.readFileSync("src/app/actions/applications.ts", "utf8");

test("recruiters can explicitly send reviewed VAs through the existing release flow", () => {
  assert.match(recruiterTalentAction, /send_client_review/);
  assert.match(recruiterTalentAction, /saveJobShortlistAction/);
  assert.match(recruiterTalentAction, /forwarded\.set\("mode", "release"\)/);
  assert.match(recruiterTalentAction, /ids\.length > 50/);
  assert.match(matching, /Send selected for client review/);
  assert.match(matching, /Save internal shortlist/);
});

test("client shortlist surfaces require active candidate access before loading identities", () => {
  assert.match(clientJob, /job_candidate_access/);
  assert.match(clientJob, /candidateAccessUnlocked/);
  assert.match(clientJob, /CandidateAccessGate/);
  assert.match(clientCandidates, /job_candidate_access/);
  assert.match(clientCandidates, /selectedAccessUnlocked/);
  assert.match(clientCandidate, /job_candidate_access/);
  assert.match(clientCandidate, /CandidateAccessGate/);
  assert.match(compare, /job_candidate_access/);
  assert.match(compare, /candidateAccessUnlocked/);
});

test("client hiring mutations still enforce candidate access server-side", () => {
  assert.match(applicationActions, /getClientApplicationWithAccess/);
  assert.match(applicationActions, /if \(!candidateAccessUnlocked\(access\?\.access_status\)\) throw new Error/);
  assert.match(applicationActions, /const \{ admin, application \} = await getClientApplicationWithAccess\(id, user\.id\)/);
  assert.match(applicationActions, /const \{ admin, application \} = await getClientApplicationWithAccess\(applicationId, user\.id\)/);
  assert.match(applicationActions, /released && candidateAccessUnlocked\(access\?\.access_status\)/);
});
