import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("VA applications require a vetted VA, an open moderated role, and reject duplicate applications", async () => {
  const applications = await read("src/app/actions/applications.ts");

  assert.match(applications, /\.eq\("status", "published"\)\.eq\("moderation_status", "clear"\)/);
  assert.match(applications, /\["approved","bench"\]\.includes\(vetting\.stage\)/);
  assert.match(applications, /if \(existing\) redirect\("\/workspace\/va\/applications\?applied=already"\)/);
  assert.match(applications, /Candidate identity remains protected until candidate access is active/);
  assert.match(applications, /Review the application before deciding whether to present the candidate to the client/);
});

test("recruiter shortlist release cannot bypass client-review guardrails", async () => {
  const matching = await read("src/app/actions/matching.ts");

  assert.match(matching, /\["release", "invite"\]\.includes\(mode\) && selected\.length > 5/);
  assert.match(matching, /mode === "release" && !job\.client_id/);
  assert.match(matching, /mode === "release" && job\.status !== "published"/);
  assert.match(matching, /mode === "release" && commercial\?\.commercial_status !== "accepted"/);
  assert.match(matching, /Client-facing shortlists require 60%\+ matches/);
  assert.match(matching, /shortlist_status: status/);
  assert.match(matching, /released_at: status === "released" \? now : null/);
});

test("client candidate actions require unlocked candidate access and cannot directly complete a hire", async () => {
  const applications = await read("src/app/actions/applications.ts");

  assert.match(applications, /candidateAccessUnlocked\(access\?\.access_status\)/);
  assert.match(applications, /Use the separate Hire candidate confirmation to complete a hire/);
  assert.match(applications, /Final hourly rate must be at least USD/);
  assert.match(applications, /Start date cannot be in the past for the client timezone/);
  assert.match(applications, /confirm_hire_transaction/);
});

test("post-hire workroom keeps execution ownership with the VA and client acceptance review-only", async () => {
  const [page, actions] = await Promise.all([
    read("src/app/workspace/client/workroom/page.tsx"),
    read("src/app/actions/workroom.ts"),
  ]);

  assert.match(page, /Accept as done/);
  assert.doesNotMatch(page, /<option value="in_progress">In progress<\/option>/);
  assert.match(actions, /Clients can only accept tasks that are ready for review/);
  assert.match(actions, /Submit the task for client review instead of marking it done/);
});

test("client-recruiter messaging remains role-scoped and excludes VAs", async () => {
  const page = await read("src/app/workspace/client/messages/page.tsx");

  assert.match(page, /Recruiter ↔ client only/);
  assert.match(page, /Virtual Assistants are never participants in this conversation/);
  assert.match(page, /Each role has its own conversation/);
  assert.match(page, /View hiring progress/);
});
