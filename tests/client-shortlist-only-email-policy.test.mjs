import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("client hiring email is shortlist-only", async () => {
  const email=await read("src/lib/email.ts");
  for (const fn of [
    "sendLeadAcknowledgementEmail",
    "sendClaimDraftEmail",
    "sendRoleDetailsRequestEmail",
    "sendStaffClientFollowupEmail",
    "sendDiscoveryBookingEmail",
    "sendPublicDiscoveryBookingEmail",
    "sendDiscoveryNoShowRebookEmail",
    "sendDiscoveryReminderEmail",
    "sendLeadProposalEmail",
  ]) {
    const start=email.indexOf(`export async function ${fn}`);
    assert.ok(start >= 0, `missing ${fn}`);
    const end=email.indexOf("export async function ",start+25);
    const body=email.slice(start,end >= 0 ? end : undefined);
    assert.match(body,/suppressClientHiringEmail/,`${fn} must be suppressed`);
  }
  assert.match(email,/client_shortlist_invite/);
  assert.match(email,/client_shortlist_ready/);
  assert.match(email,/client_shortlist_only_policy/);
});

test("shortlist release is the client hiring email moment", async () => {
  const matching=await read("src/app/actions/matching.ts");
  assert.match(matching,/eventType: "client_shortlist_ready"/);
  assert.match(matching,/Your Virtual Assistants are ready to review/);
  assert.match(matching,/Review my VA shortlist/);
  assert.match(matching,/mode === "release" && job\.client_id/);
  assert.match(matching,/eventType: "client_shortlist_invite"/);
});

test("public hiring forms do not send acknowledgement email", async () => {
  const leads=await read("src/app/actions/leads.ts");
  assert.doesNotMatch(leads,/sendLeadAcknowledgementEmail/);
  assert.match(leads,/\.eq\("lead_type", "client_hiring"\)/);
  assert.match(leads,/24 \* 60 \* 60 \* 1000/);
  assert.match(leads,/2 \* 60 \* 60 \* 1000/);
});

test("recruiter hiring inbox cannot send pre-shortlist client email", async () => {
  const page=await read("src/app/workspace/recruiter/leads/page.tsx");
  assert.doesNotMatch(page,/sendClientFollowupAction/);
  assert.doesNotMatch(page,/sendDiscoveryNoShowRebookAction/);
  assert.doesNotMatch(page,/Reply to client/);
  assert.doesNotMatch(page,/Send reply/);
  assert.match(page,/Client hiring email is paused until the recruiter sends a real VA shortlist/);
  assert.match(page,/Save proposal draft/);
});

test("proposals remain internal drafts before shortlist", async () => {
  const proposals=await read("src/app/actions/proposals.ts");
  assert.doesNotMatch(proposals,/sendLeadProposalEmail/);
  assert.match(proposals,/proposal_draft_saved/);
  assert.match(proposals,/proposal_saved=1/);
  assert.doesNotMatch(proposals,/action: "proposal_sent"/);
});

test("job-seeker detection catches first-person VA pitches", async () => {
  const detector=await read("src/lib/va-applicant-detection.ts");
  assert.match(detector,/i\\s+\\(?:can\\|would\\|will\\)/);
  assert.match(detector,/my\\s+\\(?:skills\\|experience\\|background\\|portfolio\\)/);
});
