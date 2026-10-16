import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { jobReviewDestination, jobReviewLink } from "../src/lib/job-review-link.ts";

const jobId = "26083b35-f360-4fea-85b3-9cf8ef5841f1";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("job review email uses a staff-neutral URL with UUID validation", () => {
  assert.equal(jobReviewLink(jobId), "/job-review/" + jobId);
  assert.equal(jobReviewLink("../admin"), null);
  assert.equal(jobReviewLink("javascript:alert(1)"), null);
  assert.equal(jobReviewLink("not-a-job-id"), null);
});

test("admins and recruiters resolve to their own access-controlled job details", () => {
  assert.equal(jobReviewDestination("admin", jobId), "/workspace/admin/jobs/" + jobId);
  assert.equal(jobReviewDestination("recruiter", jobId), "/workspace/recruiter/roles/" + jobId + "#overview");
  for (const role of ["client", "va", "unknown", "", null, undefined]) {
    assert.equal(jobReviewDestination(role, jobId), null);
  }
  assert.equal(jobReviewDestination("admin", "../../users"), null);
});

test("the notification email no longer hardcodes the admin-only page", async () => {
  const source = await read("src/lib/email.ts");
  const start = source.indexOf("export async function sendJobSubmittedForReviewEmail");
  const end = source.indexOf("export async function sendVettingNudgeEmail", start);
  const notification = source.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.match(notification, /jobReviewLink\(args\.jobId\)/);
  assert.match(notification, /escapeHtml\(args\.appUrl \+ reviewPath\)/);
  assert.doesNotMatch(notification, /\/workspace\/admin\/jobs\/\$\{args\.jobId\}/);
});

test("neutral review route requires sign-in, then redirects only authorized staff", async () => {
  const [routeSource, auth, recruiterDetail, adminDetail] = await Promise.all([
    read("src/app/job-review/[id]/page.tsx"),
    read("src/lib/auth.ts"),
    read("src/app/workspace/recruiter/roles/[id]/page.tsx"),
    read("src/app/workspace/admin/jobs/[id]/page.tsx"),
  ]);
  assert.match(routeSource, /requireAuthenticatedUserFast\(path\)/);
  assert.match(routeSource, /jobReviewDestination\(profile\?\.role, id\)/);
  assert.match(routeSource, /if \(!destination\) notFound\(\)/);
  assert.match(auth, /auth\/login\?next=\$\{encodeURIComponent\(nextPath\)\}/);
  assert.match(recruiterDetail, /requireRoleFast\("recruiter"\)/);
  assert.match(adminDetail, /requireRole\("admin"\)/);
});
