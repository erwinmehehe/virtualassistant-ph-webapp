import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import {
  pendingJobRequests,
  jobRequestOwnerLabel,
  jobRequestAccountLabel,
} from "../src/lib/recruiter-job-requests.ts";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

function role(id, status, created_at, changes = {}) {
  return {
    id, status, created_at, hiring_stage: "intake",
    recruiter_id: "recruiter-a", client_id: null,
    ...changes,
  };
}

test("submitted pending roles form a stable oldest-first queue without drafts or public jobs", () => {
  const rows = [
    role("new", "pending", "2026-10-14T12:00:00Z"),
    role("public", "published", "2026-10-10T12:00:00Z"),
    role("draft", "draft", "2026-10-01T12:00:00Z"),
    role("old", "pending", "2026-10-10T12:00:00Z", { client_id: "client-a" }),
    role("closed", "pending", "2026-10-09T12:00:00Z", { hiring_stage: "closed" }),
    role("filled", "pending", "2026-10-09T12:00:00Z", { hiring_stage: "filled" }),
  ];
  const original = rows.map((r) => r.id);
  const pending = pendingJobRequests(rows);
  assert.deepEqual(pending.map((r) => r.id), ["old", "new"]);
  assert.deepEqual(rows.map((r) => r.id), original, "do not mutate summary rows");
  assert.equal(jobRequestAccountLabel(pending[0]), "Client account linked");
  assert.equal(jobRequestAccountLabel(pending[1]), "Client account needed");
});

test("request owner labels distinguish own, team and unassigned roles", () => {
  assert.equal(jobRequestOwnerLabel({ recruiter_id: "recruiter-a" }, "recruiter-a"), "My request");
  assert.equal(jobRequestOwnerLabel({ recruiter_id: "recruiter-b" }, "recruiter-a"), "Team request");
  assert.equal(jobRequestOwnerLabel({ recruiter_id: null }, "recruiter-a"), "Unassigned");
});

test("Recruiter Today shows pending requests before general pipeline work", async () => {
  const page = await read("src/app/workspace/recruiter/today/page.tsx");
  assert.match(page, /getRecruiterTeamPendingJobRequests\(\)/);
  assert.match(page, /pendingRequests = teamJobRequests\.jobs/);
  assert.match(page, /Job requests awaiting review/);
  assert.ok(page.indexOf("Job requests awaiting review") < page.indexOf("Hiring at a glance"));
  assert.match(page, /\/workspace\/recruiter\/roles\?view=requests&sort=oldest/);
  assert.match(page, /\/workspace\/recruiter\/roles\/\$\{request\.id\}#overview/);
  assert.match(page, /No submitted job requests are waiting/);
});

test("Roles has a count, saved view and detail route for pending requests", async () => {
  const page = await read("src/app/workspace/recruiter/roles/page.tsx");
  assert.match(page, /\["requests", "Job requests"\]/);
  assert.match(page, /const requests=teamJobRequests\.jobs/);
  assert.match(page, /getRecruiterTeamPendingJobRequests\(\)/);
  assert.match(page, /requestedView==="requests"\?\[\]/);
  assert.match(page, /teamRequestRows\.map/);
  assert.match(page, /Job request · Pending/);
  assert.match(page, /view=requests&sort=oldest/);
  assert.match(page, /\/workspace\/recruiter\/roles\/\$\{job\.id\}/);
});

test("submitted requests notify the assigned recruiter, without changing moderation", async () => {
  const source = await read("src/app/actions/jobs.ts");
  assert.match(source, /assignedJobResult/);
  assert.match(source, /select\("recruiter_id"\)/);
  assert.match(source, /recipients\.add\(assignedRecruiterId\)/);
  assert.match(source, /New job request awaiting review/);
  assert.match(source, /\/workspace\/recruiter\/roles\/\$\{savedId\}#overview/);
  assert.match(source, /savedStatus === "pending" && previousStatus !== "pending"/);
  assert.match(source, /revalidatePath\("\/workspace\/recruiter\/today"\)/);
});

test("public job search still reads only the filtered public view", async () => {
  const source = await read("src/app/jobs/page.tsx");
  assert.match(source, /\.from\("public_jobs"\)/);
  assert.match(source, /\.gte\("min_hourly_rate", MIN_HOURLY_RATE\)/);
  assert.doesNotMatch(source, /\.from\("jobs"\)/);
  assert.match(source, /href=\{VA_JOIN_HREF\}/);
  assert.match(source, /href=\{EMPLOYER_POST_HREF\}/);
  assert.match(source, /href="\/hire"/);
  assert.match(source, /Send a hiring request without creating an account/);
});
