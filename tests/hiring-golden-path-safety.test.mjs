import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("golden path keeps the VA rate floor from job post through placement offer", async () => {
  const [jobs, applications, operations, role] = await Promise.all([
    read("src/app/actions/jobs.ts"),
    read("src/app/actions/applications.ts"),
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  assert.match(jobs, /minRate != null && minRate < MIN_HOURLY_RATE/);
  assert.match(applications, /agreedRate < MIN_HOURLY_RATE/);
  assert.match(operations, /hourlyRate < MIN_HOURLY_RATE/);
  assert.doesNotMatch(operations, /hourlyRate < 5/);
  assert.match(role, /name="hourly_rate"[\s\S]*min=\{MIN_HOURLY_RATE\}/);
});

test("legacy direct-hire validation follows the client role timezone instead of Manila", async () => {
  const applications = await read("src/app/actions/applications.ts");
  const start = applications.indexOf("export async function hireCandidateAction");
  const end = applications.indexOf("export async function inviteVaAction", start);
  const block = applications.slice(start, end);

  assert.match(applications, /jobs!inner\(client_id,title,timezone\)/);
  assert.match(applications, /import \{ isValidTimeZone \} from "@\/lib\/timezone"/);
  assert.match(block, /isValidTimeZone/);
  assert.match(block, /todayForRole/);
  assert.match(block, /client timezone/);
  assert.doesNotMatch(block, /Asia\/Manila/);
});

test("client shortlist feedback resolves stale recruiter reminders once and only alerts active fallback recruiters", async () => {
  const shortlist = await read("src/app/actions/client-shortlist.ts");
  const decisionStart = shortlist.indexOf("export async function clientShortlistDecisionAction");
  const decisionEnd = shortlist.indexOf("export async function clientRequestMoreOptionsAction", decisionStart);
  const decisionBlock = shortlist.slice(decisionStart, decisionEnd);
  const messageStart = shortlist.indexOf("export async function clientShortlistMessageAction");
  const messageEnd = shortlist.indexOf("export async function sendClientShortlistFollowupAction", messageStart);
  const messageBlock = shortlist.slice(messageStart, messageEnd);

  const resolves = decisionBlock.match(/resolveRecruiterClientReviewNotifications\(admin, jobId\)/g) || [];
  assert.equal(resolves.length, 1);
  assert.match(decisionBlock, /\.eq\("role", "recruiter"\)\.eq\("account_status", "active"\)/);
  assert.match(messageBlock, /\.eq\("role", "recruiter"\)\.eq\("account_status", "active"\)/);
});

test("post-hire workroom preserves client and VA task ownership boundaries", async () => {
  const workroom = await read("src/app/actions/workroom.ts");

  assert.match(workroom, /Clients can only accept tasks that are ready for review/);
  assert.match(workroom, /Submit the task for client review instead of marking it done/);
  assert.match(workroom, /task\.status!==\"review\"\|\|status!==\"done\"/);
});

test("canonical managed path still requires interview proceed before an offer and VA acceptance before client confirmation", async () => {
  const operations = await read("src/app/actions/recruiter-operations-system.ts");

  const createStart = operations.indexOf("export async function createPlacementOfferAction");
  const respondStart = operations.indexOf("export async function respondPlacementOfferAction", createStart);
  const confirmStart = operations.indexOf("export async function confirmPlacementOfferAction", respondStart);
  const createBlock = operations.slice(createStart, respondStart);
  const respondBlock = operations.slice(respondStart, confirmStart);
  const confirmBlock = operations.slice(confirmStart);

  assert.match(createBlock, /\.eq\("status", "completed"\)/);
  assert.match(createBlock, /\.eq\("client_decision", "proceed"\)/);
  assert.match(createBlock, /status: "pending_va"/);
  assert.match(respondBlock, /offer\.status !== "pending_va"/);
  assert.match(respondBlock, /status: "pending_client"/);
  assert.match(confirmBlock, /offer\.status !== "pending_client"/);
  assert.match(confirmBlock, /confirm_hire_transaction/);
});


test("interview state changes reject stale scheduling, cancellation, and premature feedback", async () => {
  const operations = await read("src/app/actions/recruiter-operations-system.ts");
  const clientInterviews = await read("src/app/workspace/client/interviews/page.tsx");

  const scheduleStart = operations.indexOf("export async function scheduleCandidateInterviewAction");
  const cancelStart = operations.indexOf("export async function cancelCandidateInterviewAction", scheduleStart);
  const feedbackStart = operations.indexOf("export async function submitCandidateInterviewFeedbackAction", cancelStart);
  const offerStart = operations.indexOf("export async function createPlacementOfferAction", feedbackStart);
  const scheduleBlock = operations.slice(scheduleStart, cancelStart);
  const cancelBlock = operations.slice(cancelStart, feedbackStart);
  const feedbackBlock = operations.slice(feedbackStart, offerStart);

  assert.match(scheduleBlock, /Interview request is no longer schedulable/);
  assert.match(scheduleBlock, /\["requested", "scheduled"\]\.includes\(String\(row\.status\)\)/);
  assert.match(cancelBlock, /Only requested or scheduled interviews can be cancelled/);
  assert.match(feedbackBlock, /row\.status !== "scheduled" \|\| !row\.scheduled_at/);
  assert.match(feedbackBlock, /interviewEndsAtMs > Date\.now\(\)/);
  assert.match(clientInterviews, /feedbackAvailableAt=scheduledAtMs\+Number\(row\.duration_minutes\|\|30\)\*60\*1000/);
});

test("placement offers cannot be accepted after their start date has passed", async () => {
  const [operations, clientOffers] = await Promise.all([
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/workspace/client/offers/page.tsx"),
  ]);

  const respondStart = operations.indexOf("export async function respondPlacementOfferAction");
  const confirmStart = operations.indexOf("export async function confirmPlacementOfferAction", respondStart);
  const respondBlock = operations.slice(respondStart, confirmStart);
  const confirmBlock = operations.slice(confirmStart);

  assert.match(respondBlock, /todayForOffer/);
  assert.match(respondBlock, /decision === "accept"/);
  assert.match(respondBlock, /This offer start date has passed/);
  assert.match(confirmBlock, /todayForConfirmation/);
  assert.match(confirmBlock, /refresh the final terms before confirming/);
  assert.match(clientOffers, /name="confirm_terms" required/);
});
