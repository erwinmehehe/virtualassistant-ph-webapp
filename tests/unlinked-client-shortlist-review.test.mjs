import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const matchingAction = fs.readFileSync("src/app/actions/matching.ts", "utf8");
const matchingUi = fs.readFileSync("src/components/staff-job-matching.tsx", "utf8");
const matchingTable = fs.readFileSync("src/components/matching-candidate-table.tsx", "utf8");
const leadClaims = fs.readFileSync("src/lib/lead-claims.ts", "utf8");
const recruiterPage = fs.readFileSync("src/app/workspace/recruiter/matching/[id]/page.tsx", "utf8");

test("unlinked lead roles offer an invite path instead of a dead client-release button", () => {
  assert.match(matchingTable, /name="mode" value="invite"/);
  assert.match(matchingTable, /invite client/);
  assert.match(matchingUi, /Client account not linked yet/);
  assert.doesNotMatch(matchingUi, /disabled=\{!job\.client_id\}/);
});

test("invite mode saves the exact selected VAs and sends a secure claim link", () => {
  assert.match(matchingAction, /\["save", "release", "invite"\]/);
  assert.match(matchingAction, /client_review_invited/);
  assert.match(matchingAction, /metadata: \{ va_ids: selected, lead_id: inviteLead\.id \}/);
  assert.match(matchingAction, /\/auth\/join\/client\?/);
  assert.match(matchingAction, /firstName,/);
  assert.match(matchingAction, /Review my shortlist/);
  assert.match(matchingAction, /teamLabel: "Hiring team"/);
  assert.match(matchingAction, /senderName: "VirtualAssistant\.com\.ph Hiring Team"/);
  assert.match(matchingAction, /contacted VirtualAssistant\.com\.ph about hiring support/);
  assert.doesNotMatch(matchingAction, /body: \`Hi \${firstName}/);
  assert.match(recruiterPage, /client_invited/);
});

test("client claim only releases candidates from a recorded client-review invite", () => {
  assert.match(leadClaims, /client_review_invited/);
  assert.match(leadClaims, /invite\.metadata\.va_ids/);
  assert.match(leadClaims, /shortlist_status: "released"/);
  assert.match(leadClaims, /shortlist_released_after_client_claim/);
  assert.match(leadClaims, /eq\("shortlist_status", "proposed"\)/);
});

test("recruiter matcher uses page scrolling instead of clipping candidate rows", () => {
  assert.match(matchingTable, /maxHeight:"none"/);
  assert.match(matchingTable, /overflowX:"auto"/);
});
