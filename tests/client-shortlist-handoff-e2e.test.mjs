import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const matchingTable = fs.readFileSync("src/components/matching-candidate-table.tsx", "utf8");
const clientCard = fs.readFileSync("src/components/client-shortlist-candidate-card.tsx", "utf8");
const clientCandidates = fs.readFileSync("src/app/workspace/client/candidates/page.tsx", "utf8");
const clientHiringRoomMigration = fs.readFileSync("supabase/migrations/20260924172000_client_hiring_room_summary.sql", "utf8");
const matchingAction = fs.readFileSync("src/app/actions/matching.ts", "utf8");
const leadClaims = fs.readFileSync("src/lib/lead-claims.ts", "utf8");
const clientActions = fs.readFileSync("src/app/actions/client-shortlist.ts", "utf8");

test("recruiter preview and client Hiring Room use the same candidate card", () => {
  assert.match(matchingTable, /Preview client view/);
  assert.match(matchingTable, /ClientShortlistCandidateCard/);
  assert.match(clientCandidates, /ClientShortlistCandidateCard/);
  assert.match(matchingTable, /Full names, internal match percentages, confidence, recruiter-only risks, and private notes are not shown/);
});

test("shared client card exposes useful shortlist facts but not recruiter-only or contact data", () => {
  assert.match(clientCard, /maskVaName/);
  assert.match(clientCard, /clientMatchLabel/);
  assert.match(clientCard, /yearsExperience/);
  assert.match(clientCard, /weeklyHours/);
  assert.match(clientCard, /hourlyRate/);
  assert.match(clientCard, /skills/);
  assert.match(clientCard, /tools/);
  assert.match(clientCard, /Why we recommend this VA/);
  assert.doesNotMatch(clientCard, /confidence/i);
  assert.doesNotMatch(clientCard, /email/i);
  assert.doesNotMatch(clientCard, /phone/i);
  assert.doesNotMatch(clientCard, /avatar/i);
  assert.doesNotMatch(clientCard, /match-percent|match-meter/);
});

test("invite handoff persists exactly the selected VA ids and releases only that recorded invite after claim", () => {
  assert.match(matchingAction, /const selected = \[\.\.\.new Set\(formData\.getAll\("va_id"\)/);
  assert.match(matchingAction, /metadata: \{ va_ids: selected, lead_id: inviteLead\.id \}/);
  assert.match(leadClaims, /invite\.metadata\.va_ids/);
  assert.match(leadClaims, /\.eq\("shortlist_status", "proposed"\)/);
  assert.match(leadClaims, /\.in\("va_id", invitedIds\)/);
  assert.match(leadClaims, /shortlist_status: "released"/);
  assert.match(leadClaims, /shortlist_released_after_client_claim/);
});

test("client shortlist remains account-scoped, released-only, access-gated, and feeds decisions back to recruiters", () => {
  assert.match(clientHiringRoomMigration, /where client_id=p_client_id/);
  assert.match(clientHiringRoomMigration, /where s\.shortlist_status='released'/);
  assert.match(clientHiringRoomMigration, /a\.access_status in \('paid','comped'\)/);
  assert.match(clientCandidates, /candidateAccessUnlocked/);
  assert.match(clientActions, /\.eq\("client_id", user\.id\)/);
  assert.match(clientActions, /\.eq\("shortlist_status", "released"\)/);
  assert.match(clientActions, /client_decision: decision/);
  assert.match(clientActions, /Client requested an interview|Client marked a VA interested/);
  assert.match(clientActions, /href: `\/workspace\/recruiter\/roles\/\$\{jobId\}`/);
});

test("preview controls cannot accidentally submit client decisions", () => {
  assert.match(matchingTable, /type="button" disabled>Interested/);
  assert.match(matchingTable, /type="button" disabled>Request interview/);
  assert.match(matchingTable, /type="button" disabled>Hold/);
  assert.match(matchingTable, /type="button" disabled>Pass/);
});
