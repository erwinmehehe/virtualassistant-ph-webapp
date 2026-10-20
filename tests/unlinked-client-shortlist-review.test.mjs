import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const matchingAction = fs.readFileSync("src/app/actions/matching.ts", "utf8");
const matchingUi = fs.readFileSync("src/components/staff-job-matching.tsx", "utf8");
const matchingTable = fs.readFileSync("src/components/matching-candidate-table.tsx", "utf8");
const leadClaims = fs.readFileSync("src/lib/lead-claims.ts", "utf8");
const gatedRelease = fs.readFileSync("src/lib/client-shortlist-release.ts", "utf8");
const recruiterPage = fs.readFileSync("src/app/workspace/recruiter/roles/[id]/page.tsx", "utf8");

test("unlinked lead roles offer an invite path instead of a dead client-release button", () => {
  assert.match(matchingTable, /name="mode" value="invite"/);
  assert.match(matchingTable, /invite client/);
  assert.match(matchingUi, /Client account not linked yet/);
  assert.doesNotMatch(matchingUi, /disabled=\{!job\.client_id\}/);
});

test("invite mode saves the exact selected VAs and sends a secure claim link", () => {
  assert.match(matchingAction, /\["save", "release", "invite"\]/);
  assert.match(matchingAction, /client_review_invited/);
  assert.match(matchingAction, /metadata: \{ va_ids: selected, lead_id: inviteLead\.id,/);
  assert.match(matchingAction, /"\/auth\/join\/client"/);
  assert.match(matchingAction, /firstName,/);
  assert.match(matchingAction, /Activate my hiring workspace/);
  assert.match(matchingAction, /invite_sent_at: now/);
  assert.match(matchingAction, /email_reason: delivery\.reason \|\| "email_unavailable"/);
  assert.match(matchingAction, /teamLabel: "Hiring team"/);
  assert.match(matchingAction, /senderName: "VirtualAssistant\.com\.ph Hiring Team"/);
  assert.match(matchingAction, /contacted VirtualAssistant\.com\.ph about hiring support/);
  assert.doesNotMatch(matchingAction, /body: \`Hi \${firstName}/);
  assert.match(recruiterPage, /client_invited/);
});

test("client claim defers release until role, terms, and candidate access are approved", () => {
  assert.match(leadClaims, /releaseInvitedShortlistWhenReady/);
  assert.match(gatedRelease, /client_review_invited/);
  assert.match(gatedRelease, /invite\.metadata\.va_ids/);
  assert.match(gatedRelease, /commercial_status !== "accepted"/);
  assert.match(gatedRelease, /candidateAccessUnlocked/);
  assert.match(gatedRelease, /shortlist_status: "released"/);
  assert.match(gatedRelease, /eq\("shortlist_status", "proposed"\)/);
});

test("recruiter matcher uses page scrolling instead of clipping candidate rows", () => {
  assert.match(matchingTable, /maxHeight:"none"/);
  assert.match(matchingTable, /overflowX:"auto"/);
});
