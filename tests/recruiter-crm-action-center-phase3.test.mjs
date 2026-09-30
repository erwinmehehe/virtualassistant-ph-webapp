import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("CRM record keeps only the primary recruiter actions visible by default",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");
  assert.match(page,/Move this hire forward/);
  assert.match(page,/sendClientFollowupAction/);
  assert.match(page,/scheduleDiscoveryAction/);
  assert.match(page,/completeDiscoveryAction/);
  assert.match(page,/cancelRecruiterDiscoveryAction/);
  assert.match(page,/createRecruiterTaskAction/);
  assert.match(page,/Mark contacted/);
  assert.match(page,/Advanced CRM fields/);
  assert.match(page,/No generic second acknowledgement/);
});

test("CRM relationship timeline merges delivery proposal shortlist interview offer and placement events",async()=>{
  const page=await read("src/app/workspace/recruiter/crm/[leadId]/page.tsx");
  for(const table of [
    "outbound_email_events",
    "lead_proposals",
    "job_shortlist_candidates",
    "candidate_interviews",
    "placement_offers",
    "workrooms",
  ]) assert.match(page,new RegExp(table));
  assert.match(page,/Activity history/);
  assert.match(page,/Client viewed proposal/);
  assert.match(page,/Candidate released to client/);
  assert.match(page,/Interview scheduled/);
  assert.match(page,/Client confirmed offer/);
  assert.match(page,/Placement workspace created/);
  assert.match(page,/timeline\.sort/);
});

test("manual CRM client email is explicit and automated pre-shortlist email remains off",async()=>{
  const email=await read("src/lib/email.ts");
  assert.match(email,/const CLIENT_PRE_SHORTLIST_EMAILS_ENABLED = false/);
  const start=email.indexOf("export async function sendStaffClientFollowupEmail");
  assert.ok(start>=0);
  const helper=email.slice(start,start+1500);
  assert.doesNotMatch(helper,/client_email_deferred_until_shortlist/);
  assert.match(helper,/Manual recruiter email only/);
});

test("direct client touches and discovery stage changes trigger existing CRM workflows",async()=>{
  const actions=await read("src/app/actions/recruiter.ts");
  assert.match(actions,/advancedToContacted[\s\S]*runCrmStageWorkflows\(\{ leadId: activityId, stage: "contacted"/);
  assert.match(actions,/scheduleDiscoveryAction[\s\S]*runCrmStageWorkflows\(\{ leadId, stage: "discovery_booked"/);
  assert.match(actions,/cancelRecruiterDiscoveryAction[\s\S]*runCrmStageWorkflows\(\{ leadId, stage: "nurture"/);
  assert.match(actions,/completeDiscoveryAction[\s\S]*runCrmStageWorkflows\(\{ leadId, stage, actorId: user\.id \}\)/);
});


test("CRM activity panel combines email and in-app chat signals and exposes one next action", async () => {
  const [page, panel] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/page.tsx"),
    read("src/components/client-engagement-panel.tsx"),
  ]);
  assert.match(page, /last_client_contact_at/);
  assert.match(page, /lastClientReplyAt/);
  assert.match(panel, /Last email reply \/ chat reply/);
  for (const label of ["Follow up", "Review decision", "Schedule interview", "Close role", "Generate recommendation", "Finish proposal", "Revise proposal"]) {
    assert.match(page, new RegExp(label));
  }
  assert.match(page, /nextAction\.detail/);
  assert.match(page, /nextAction\.label/);
});
