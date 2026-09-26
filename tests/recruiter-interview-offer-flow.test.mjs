import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("Role Control Center drives completed interviews into recruiter-prepared offers",async()=>{
  const page=await read("src/app/workspace/recruiter/roles/[id]/page.tsx");

  assert.match(page,/createPlacementOfferAction/);
  assert.match(page,/query\.offer_sent/);
  assert.match(page,/client_decision === "proceed"/);
  assert.match(page,/client_feedback_reason/);
  assert.match(page,/client_feedback/);
  assert.match(page,/name="job_id"/);
  assert.match(page,/name="va_id"/);
  assert.match(page,/name="hourly_rate"/);
  assert.match(page,/name="weekly_hours"/);
  assert.match(page,/name="start_date"/);
  assert.match(page,/name="schedule"/);
  assert.match(page,/name="timezone"/);
  assert.match(page,/name="service_type"/);
  assert.match(page,/Prepare placement offer/);
});

test("placement offer action requires a completed Proceed interview and stays in canonical role workspace",async()=>{
  const actions=await read("src/app/actions/recruiter-operations-system.ts");
  const offerAction=actions.match(/export async function createPlacementOfferAction[\s\S]*?export async function respondPlacementOfferAction/)?.[0]||"";
  const feedbackAction=actions.match(/export async function submitCandidateInterviewFeedbackAction[\s\S]*?export async function createPlacementOfferAction/)?.[0]||"";

  assert.match(offerAction,/candidate_interviews/);
  assert.match(offerAction,/\.eq\("status", "completed"\)/);
  assert.match(offerAction,/\.eq\("client_decision", "proceed"\)/);
  assert.match(offerAction,/Complete a client interview with Proceed before preparing an offer/);
  assert.match(offerAction,/Another candidate already has an active placement offer/);
  assert.match(offerAction,/This offer has already advanced beyond recruiter editing/);
  assert.match(offerAction,/redirect\(`\/workspace\/recruiter\/roles\/\$\{jobId\}\?offer_sent=1#interviews`\)/);
  assert.doesNotMatch(offerAction,/\/workspace\/recruiter\/matching\//);

  assert.match(feedbackAction,/\/workspace\/recruiter\/roles\/\$\{row\.job_id\}#interviews/);
  assert.doesNotMatch(feedbackAction,/\/workspace\/recruiter\/matching\//);
});
