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

test("recruiters can attach client-facing recommendations while availability stays informational", () => {
  assert.match(matchingTable, /Add a short client-facing reason \(optional\)/);
  assert.match(matchingTable, /availabilityLabel\(row\.va\.availability_status\)/);
  assert.doesNotMatch(matchingTable, /Confirmation needed/);
  assert.doesNotMatch(matchingTable, /confirmed within the last 14 days/);
  assert.doesNotMatch(matchingTable, /Send availability reminder/);
  assert.match(matching, /otherClientReviews/);
  assert.match(matching, /potentialCommittedHours/);
});

test("client shortlist keeps decisions simple and gives the recruiter an explicit more-options signal", () => {
  assert.match(clientCandidates, /recordClientShortlistView/);
  assert.match(clientHiringRoomMigration, /client_shortlist_viewed/);
  assert.match(clientCandidates, /label="Keep shortlisted"/);
  assert.match(clientCandidates, /label="Request interview"/);
  assert.match(clientCandidates, /label="Confirm pass"/);
  assert.match(clientCandidates, /Need more options/);
  assert.match(clientCandidates, /clientRequestMoreOptionsAction/);
  assert.match(clientCandidates, /Message recruiter about this role/);
  assert.doesNotMatch(clientCandidates, /summary className=.*>Hold<\/summary>/);
  assert.doesNotMatch(clientCandidates, /clientShortlistMessageAction/);
  assert.match(actions, /client_more_options_requested/);
  assert.match(actions, /Client needs more candidate options/);
  assert.match(actions, /hiring_stage: "sourcing"/);
  assert.match(actions, /candidateAccessUnlocked\(access\?\.access_status\)/);
  assert.match(actions, /There is no released shortlist to request replacements for/);
  assert.match(actions, /ask for more options so we can keep your search moving/);
  assert.match(clientCandidateCard, /Why we recommend this VA/);
  assert.match(clientCandidates, /ClientShortlistCandidateCard/);
});

test("canonical recruiter role workspace exposes client follow-up and replacement states", () => {
  assert.match(recruiterRole, /Client handoff/);
  assert.match(recruiterRole, /Send client follow-up/);
  assert.match(recruiterRole, /Needs replacement matches/);
  assert.match(recruiterRole, /Client requested more options/);
  assert.match(recruiterRole, /Build more options/);
  assert.doesNotMatch(nav, /\["Client review", "\/workspace\/recruiter\/client-review"/);
  assert.match(nav, /\["Roles", "\/workspace\/recruiter\/roles"/);
});
