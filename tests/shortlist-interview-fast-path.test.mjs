import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("client shortlist decisions are idempotent and interview requests create one active interview", async () => {
  const action=await read("src/app/actions/client-shortlist.ts");
  const start=action.indexOf("export async function clientShortlistDecisionAction");
  const end=action.indexOf("export async function sendClientShortlistFollowupAction",start);
  const block=action.slice(start,end);
  assert.match(block,/client_decision_note/);
  assert.match(block,/shortlist\.client_decision === decision && \(shortlist\.client_decision_note \|\| null\) === decisionNote/);
  assert.match(block,/\.eq\("job_id", jobId\)[\s\S]*\.eq\("va_id", vaId\)[\s\S]*\.neq\("status", "cancelled"\)/);
  assert.match(block,/status: "requested"/);
  assert.match(block,/client_shortlist_decision/);
  assert.match(block,/interview_requested/);
});

test("changing away from an unscheduled interview request cancels the stale request", async () => {
  const action=await read("src/app/actions/client-shortlist.ts");
  const start=action.indexOf("export async function clientShortlistDecisionAction");
  const end=action.indexOf("export async function sendClientShortlistFollowupAction",start);
  const block=action.slice(start,end);
  assert.match(block,/else if \(shortlist\.client_decision === "interview"\)/);
  assert.match(block,/\.eq\("status", "requested"\)/);
  assert.match(block,/\.is\("scheduled_at", null\)/);
  assert.match(block,/status: "cancelled"/);
});

test("interview scheduling can be completed by client or staff without client email", async () => {
  const action=await read("src/app/actions/recruiter-operations-system.ts");
  const start=action.indexOf("export async function scheduleCandidateInterviewAction");
  const end=action.indexOf("export async function cancelCandidateInterviewAction",start);
  const block=action.slice(start,end);
  assert.match(block,/requireAnyRole\(\["client", "recruiter", "admin"\]\)/);
  assert.match(block,/profile\.role === "client" && row\.client_id !== user\.id/);
  assert.match(block,/scheduled_local/);
  assert.match(block,/zonedDateTimeToUtc/);
  assert.match(block,/isValidTimeZone/);
  assert.match(block,/clientAuth/);
  assert.match(block,/attendeeEmails = \[vaAuth\.user\?\.email, clientAuth\.user\?\.email\]/);
  assert.match(block,/formatDateTimeInTimeZone/);
  assert.match(block,/user_id: row\.client_id/);
  assert.match(block,/interview_scheduled/);
  assert.match(block,/candidate_interview_scheduled/);
  assert.doesNotMatch(block,/to: .*client/i);
});

test("recruiter role page schedules requested interviews in place", async () => {
  const [role,scheduler]=await Promise.all([
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/components/candidate-interview-scheduler.tsx"),
  ]);
  assert.match(role,/Client requested this interview/);
  assert.match(role,/CandidateInterviewScheduler interviewId=\{x\.id\}/);
  assert.match(role,/Reschedule from this role/);
  assert.match(role,/interview_scheduled/);
  assert.match(scheduler,/returnTo\?:string/);
  assert.match(scheduler,/name="return_to"/);
});

test("Recruiter My Day exposes unscheduled interview requests as a first-class queue", async () => {
  const [today,migration]=await Promise.all([
    read("src/app/workspace/recruiter/today/page.tsx"),
    read("supabase/migrations/20260927052620_shortlist_interview_fast_path.sql"),
  ]);
  assert.match(today,/interviewRequests/);
  assert.match(today,/id="interview-requests"/);
  assert.match(today,/Schedule requested interviews/);
  assert.match(today,/Schedule interview/);
  assert.match(migration,/'interview_requested'/);
  assert.match(migration,/ci\.status='requested'/);
  assert.match(migration,/interval '4 hours'/);
  assert.match(migration,/action_type in \('interview_requested','interview_today','interview_feedback_missing'\)/);
});

test("client shortlist shows a compact decision-state summary", async () => {
  const page=await read("src/app/workspace/client/candidates/page.tsx");
  assert.match(page,/Shortlist decision saved\. Your recruiter can see it immediately/);
  assert.match(page,/const undecided =/);
  assert.match(page,/const interviewRequested =/);
  assert.match(page,/>Waiting<\/span><strong>\{undecided\}/);
  assert.match(page,/>Interview<\/span><strong>\{interviewRequested\}/);
});
