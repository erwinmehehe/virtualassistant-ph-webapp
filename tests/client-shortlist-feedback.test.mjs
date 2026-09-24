import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const actions = fs.readFileSync("src/app/actions/client-shortlist.ts", "utf8");
const matching = fs.readFileSync("src/components/staff-job-matching.tsx", "utf8");
const matchingTable = fs.readFileSync("src/components/matching-candidate-table.tsx", "utf8");
const clientCandidates = fs.readFileSync("src/app/workspace/client/candidates/page.tsx", "utf8");
const clientHiringRoomMigration = fs.readFileSync("supabase/migrations/20260924172000_client_hiring_room_summary.sql", "utf8");
const clientCandidateCard = fs.readFileSync("src/components/client-shortlist-candidate-card.tsx", "utf8");
const recruiterRole = fs.readFileSync("src/app/workspace/recruiter/roles/[id]/page.tsx", "utf8");
const nav = fs.readFileSync("src/components/app-nav-links.tsx", "utf8");
const migration = fs.readFileSync("supabase/migrations/20260915005739_client_shortlist_feedback_and_availability.sql", "utf8");

test("client shortlist feedback is authorized and keeps release state separate from client decisions", () => {
  assert.match(actions, /requireRole\("client"\)/);
  assert.match(actions, /candidateAccessUnlocked/);
  assert.match(actions, /shortlist_status", "released"/);
  assert.match(actions, /client_decision/);
  assert.match(migration, /client_decision in \('interested','interview','pass'\)/);
});

test("recruiters can attach client-facing recommendations and matcher uses current VA profile availability", () => {
  assert.match(matchingTable, /Why this VA is a strong fit for this client/);
  assert.match(matchingTable, /From the VA&apos;s current profile/);
  assert.doesNotMatch(matchingTable, />Ask VA</);
  assert.doesNotMatch(matchingTable, />Mark confirmed</);
  assert.doesNotMatch(matchingTable, /Needs confirmation/);
  assert.match(matchingTable, /current profile/);
  assert.match(matching, /otherClientReviews/);
  assert.match(matching, /potentialCommittedHours/);
});

test("client shortlist records viewed state and offers interested interview and pass decisions", () => {
  assert.match(clientCandidates, /recordClientShortlistView/);
  assert.match(clientHiringRoomMigration, /client_shortlist_viewed/);
  assert.match(clientCandidates, /label="Interested"/);
  assert.match(clientCandidates, /label="Request interview"/);
  assert.match(clientCandidates, /label="Confirm pass"/);
  assert.match(clientCandidateCard, /Why we recommend this VA/);
  assert.match(clientCandidates, /ClientShortlistCandidateCard/);
});

test("canonical recruiter role workspace exposes client follow-up and replacement states", () => {
  assert.match(recruiterRole, /Client handoff/);
  assert.match(recruiterRole, /Send client follow-up/);
  assert.match(recruiterRole, /Needs replacement matches/);
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
});
