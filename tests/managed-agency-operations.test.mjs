import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const read=(path)=>fs.readFileSync(new URL(`../${path}`,import.meta.url),"utf8");

test("client workspace exposes recruiter-curated shortlist instead of raw applicant management",()=>{
  const candidates=read("src/app/workspace/client/candidates/page.tsx");
  const candidateCard=read("src/components/client-shortlist-candidate-card.tsx");
  const job=read("src/app/workspace/client/jobs/[id]/page.tsx");
  assert.match(candidates,/Only candidates selected by our recruiting team appear here/);
  assert.match(candidates,/ClientShortlistCandidateCard/);
  assert.match(candidateCard,/Why we recommend this VA/);
  assert.doesNotMatch(candidates,/updateApplicationStatusAction|hireCandidateAction|inviteVaAction/);
  assert.match(job,/You do not need to manage raw applicants/);
  assert.doesNotMatch(job,/updateApplicationStatusAction|hireCandidateAction|inviteVaAction/);
});

test("client candidate detail is released-shortlist gated and cannot directly hire",()=>{
  const detail=read("src/app/workspace/client/candidates/[id]/page.tsx");
  assert.match(detail,/shortlist_status","released/);
  assert.match(detail,/Raw VA interest and applications are recruiter-only/);
  assert.doesNotMatch(detail,/hireCandidateAction|updateApplicationStatusAction|Confirm hire and create workroom|Contact email/);
  assert.match(detail,/Recruiter-managed contact/);
});

test("candidate comparison excludes candidates the recruiter has not released",()=>{
  const compare=read("src/app/workspace/client/compare/page.tsx");
  assert.match(compare,/shortlist_status","released/);
  assert.match(compare,/releasedSet/);
  assert.match(compare,/recruiter-released candidates/);
});

test("public talent selection is framed as recruiter preference rather than client shortlist",()=>{
  const shortlist=read("src/components/talent-shortlist.tsx");
  assert.match(shortlist,/Save for recruiter/);
  assert.match(shortlist,/Send preferences to recruiter/);
  assert.doesNotMatch(shortlist,/Interview this shortlist/);
});

test("VA opportunity workspace sends interest through recruiter review without exposing numeric score",()=>{
  const apps=read("src/app/workspace/va/applications/page.tsx");
  assert.match(apps,/Interest sent\. A recruiter will review/);
  assert.match(apps,/Recruiter review/);
  assert.doesNotMatch(apps,/\/100/);
});

test("workroom onboarding actions enforce participant ownership on both UI and server",()=>{
  const action=read("src/app/actions/workroom-checklist.ts");
  const client=read("src/app/workspace/client/workroom/page.tsx");
  const va=read("src/app/workspace/va/workroom/page.tsx");
  assert.match(action,/item\.owner_role!==profile\.role/);
  assert.match(action,/You are not part of this placement/);
  assert.match(client,/owner_role==="client"/);
  assert.match(client,/toggleOwnedChecklistAction/);
  assert.match(va,/owner_role==="va"/);
  assert.match(va,/toggleOwnedChecklistAction/);
  assert.doesNotMatch(va,/toggleChecklistAction/);
});
