import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("discovery to proposal to shortlist to interview to offer stays one connected flow", async () => {
  const [discovery, proposals, shortlist, operations, role] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/page.tsx"),
    read("src/app/actions/proposals.ts"),
    read("src/app/actions/client-shortlist.ts"),
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  assert.match(discovery, /name="intent" value="proposal"/);
  assert.match(discovery, /Generate recommendation/);
  assert.match(proposals, /sendProposalToClientAction/);
  assert.match(proposals, /acceptLeadProposalAction/);
  assert.match(proposals, /autoReleaseTopMatches/);
  assert.match(shortlist, /clientShortlistDecisionAction/);
  assert.match(shortlist, /status: "requested"/);
  assert.match(operations, /scheduleCandidateInterviewAction/);
  assert.match(operations, /submitCandidateInterviewFeedbackAction/);
  assert.match(operations, /createPlacementOfferAction/);
  assert.match(operations, /respondPlacementOfferAction/);
  assert.match(operations, /confirmPlacementOfferAction/);
  assert.match(role, /Prepare placement offer/);
});

test("proposal follow-up timing never silently assumes Manila and revision alerts resolve on resend", async () => {
  const [proposals,hardening] = await Promise.all([
    read("src/app/actions/proposals.ts"),
    read("supabase/migrations/20261004143000_conversion_hardening.sql"),
  ]);
  const sendStart = proposals.indexOf("export async function sendProposalToClientAction");
  const sendEnd = proposals.indexOf("export async function createAndSendProposalAction", sendStart);
  const sendBlock = proposals.slice(sendStart, sendEnd);
  const responseStart = proposals.indexOf("export async function respondToLeadProposalAction");
  const responseEnd = proposals.indexOf("type AtomicAcceptanceResult", responseStart);
  const responseBlock = proposals.slice(responseStart, responseEnd);

  assert.ok(sendStart >= 0 && sendEnd > sendStart);
  assert.doesNotMatch(sendBlock, /proposalFollowUpTimeZone = "Asia\/Manila"/);
  assert.match(sendBlock, /p_follow_up_timezone: proposalFollowUpTimeZone/);
  assert.match(hardening, /when nullif\(btrim\(coalesce\(p_follow_up_timezone, ''\)\), ''\) is null then 'relative_48h'/);
  assert.match(hardening, /else 'client_local_9am'/);
  assert.match(sendBlock, /Proposal changes requested:%/);
  assert.match(sendBlock, /done_at: now\.toISOString\(\)/);
  assert.match(responseBlock, /respond_to_lead_proposal_atomic/);
  assert.match(hardening, /next_follow_up_at = null/);
  assert.match(responseBlock, /type: "proposal"/);
});

test("shortlist decisions and interview changes resolve obsolete recruiter and VA notifications", async () => {
  const shortlist = await read("src/app/actions/client-shortlist.ts");
  const start = shortlist.indexOf("export async function clientShortlistDecisionAction");
  const end = shortlist.indexOf("export async function clientRequestMoreOptionsAction", start);
  const block = shortlist.slice(start, end);

  assert.match(shortlist, /resolveRecruiterClientReviewNotifications/);
  assert.match(shortlist, /resolveVaInterviewRequestNotification/);
  assert.match(block, /shortlist\.client_decision === "interview"/);
  assert.match(block, /resolveVaInterviewRequestNotification\(admin, vaId, job\.title\)/);
  assert.match(block, /resolveRecruiterClientReviewNotifications\(admin, jobId\)/);
  assert.match(shortlist, /type", "client_review"/);
  assert.match(shortlist, /done_at: now/);
});

test("candidate interviews use explicit IANA wall time without adding pre-shortlist client email", async () => {
  const [scheduler, operations, role] = await Promise.all([
    read("src/components/candidate-interview-scheduler.tsx"),
    read("src/app/actions/recruiter-operations-system.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
  ]);

  const start = operations.indexOf("export async function scheduleCandidateInterviewAction");
  const end = operations.indexOf("export async function cancelCandidateInterviewAction", start);
  const block = operations.slice(start, end);

  assert.match(scheduler, /name="scheduled_local"/);
  assert.doesNotMatch(scheduler, /new Date\(value\)\.toISOString\(\)/);
  assert.match(scheduler, /timeZone: preferredTimeZone/);
  assert.match(block, /zonedDateTimeToUtc\(scheduledLocal, timezone\)/);
  assert.match(block, /Confirm a valid timezone before scheduling the interview/);
  assert.match(block, /attendeeEmails = \[vaAuth\.user\?\.email\]/);
  assert.doesNotMatch(block, /clientAuth\.user\?\.email/);
  assert.match(block, /formatDateTimeInTimeZone\(scheduledAt\.toISOString\(\), timezone\)/);
  assert.doesNotMatch(block, /\$\{when\} UTC/);
  assert.match(role, /const roleTimeZone = isValidTimeZone\(job\.timezone\)/);
  assert.match(role, /timeZone=\{roleTimeZone\}/);
  assert.match(role, /formatDateTimeInTimeZone\(x\.scheduled_at, roleTimeZone\)/);
});

test("interview and placement notification lifecycle closes stale actions after each transition", async () => {
  const operations = await read("src/app/actions/recruiter-operations-system.ts");

  assert.match(operations, /resolveOpenNotifications/);
  assert.match(operations, /Interview requested for \$\{interviewTitle\}/);
  assert.match(operations, /Interview scheduled: \$\{interviewTitle\}/);
  assert.match(operations, /Client wants to proceed after interview/);
  assert.match(operations, /Placement offer: \$\{job\.title\}/);
  assert.match(operations, /VA accepted the offer: \$\{offerTitle\}/);
  assert.match(operations, /hrefLike: `\/workspace\/recruiter\/roles\/\$\{offer\.job_id\}%`/);
  assert.match(operations, /type: "client_review"/);
  assert.match(operations, /type: "offer"/);
});

test("offer start-date validation follows the client role timezone instead of Manila", async () => {
  const operations = await read("src/app/actions/recruiter-operations-system.ts");
  const start = operations.indexOf("export async function createPlacementOfferAction");
  const end = operations.indexOf("export async function respondPlacementOfferAction", start);
  const block = operations.slice(start, end);

  assert.match(block, /select\("id,title,client_id,status,timezone"\)/);
  assert.match(block, /isValidTimeZone\(job\.timezone\)/);
  assert.match(block, /todayForRole/);
  assert.match(block, /Start date cannot be in the past for the client timezone/);
  assert.doesNotMatch(block, /todayManila/);
});

test("discovery and proposal mobile pages stay clear of the fixed bottom navigation", async () => {
  const [discoveryCss, proposalCss] = await Promise.all([
    read("src/app/workspace/recruiter/crm/[leadId]/discovery/discovery.module.css"),
    read("src/app/workspace/recruiter/crm/[leadId]/proposal/proposal.module.css"),
  ]);

  assert.match(discoveryCss, /padding-bottom: calc\(116px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(discoveryCss, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(discoveryCss, /@media \(max-width: 380px\)/);
  assert.match(proposalCss, /calc\(116px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(proposalCss, /scroll-snap-type:x proximity/);
  assert.match(proposalCss, /\.statusFlow::-webkit-scrollbar\{display:none\}/);
});
