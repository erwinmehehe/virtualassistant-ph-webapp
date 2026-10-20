import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const matching = fs.readFileSync("src/app/actions/matching.ts", "utf8");
const release = fs.readFileSync("src/lib/client-shortlist-release.ts", "utf8");
const claims = fs.readFileSync("src/lib/lead-claims.ts", "utf8");
const terms = fs.readFileSync("src/app/actions/jobs.ts", "utf8");
const feedback = fs.readFileSync("src/app/actions/client-shortlist.ts", "utf8");
const feedbackEmail = fs.readFileSync("src/lib/client-feedback-email.ts", "utf8");
const webhook = fs.readFileSync("src/app/api/webhooks/resend/route.ts", "utf8");
const recruiter = fs.readFileSync("src/app/workspace/recruiter/roles/[id]/page.tsx", "utf8");

test("an invite is not counted as a released shortlist", () => {
  assert.match(matching, /mode === "invite" \? "client_shortlist_invited"/);
  assert.match(matching, /profiles become available|Candidate profiles become available/);
  assert.match(matching, /existingClientAccount \? "\/auth\/login" : "\/auth\/join\/client"/);
  assert.match(matching, /existingProfile\?\.role === "va"/);
  assert.match(recruiter, /Invite sent, account not linked/);
});

test("claiming an account never bypasses commercial terms or candidate access", () => {
  assert.match(claims, /releaseInvitedShortlistWhenReady/);
  assert.match(claims, /linkedJobIds/);
  assert.match(release, /job\.status !== "published"/);
  assert.match(release, /commercial\?\.commercial_status !== "accepted"/);
  assert.match(release, /candidateAccessUnlocked\(access\?\.access_status\)/);
  assert.match(release, /publicationMissingDetails\(job\)/);
  assert.match(release, /isTalentAgencyCertified/);
  assert.match(release, /shortlist_status: "released"/);
  assert.match(terms, /releaseInvitedShortlistWhenReady\(admin, user\.id, jobId\)/);
  assert.match(matching, /releaseInvitedShortlistWhenReady\(admin, job\.client_id, jobId\)/);
});

test("email release errors are visible and cannot be reported as successful sends", () => {
  assert.match(matching, /releaseEmailUnavailable = !delivery\.sent/);
  assert.match(matching, /client_shortlist_email_unavailable=1/);
  assert.match(matching, /client_shortlist_delivery_failed/);
  assert.match(release, /client_shortlist_delivery_failed/);
  assert.match(recruiter, /client_shortlist_email_unavailable/);
});

test("client feedback notifies recruiters without emailing private candidate details", () => {
  assert.match(feedback, /emailRecruiterAboutClientFeedback/);
  assert.match(feedback, /kind: "decision"/);
  assert.match(feedback, /kind: "more_options"/);
  assert.match(feedback, /kind: "message"/);
  assert.match(feedbackEmail, /role", "recruiter"/);
  assert.match(feedbackEmail, /"client_shortlist_feedback"/);
  assert.match(feedbackEmail, /idempotencyKey:/);
  assert.doesNotMatch(feedbackEmail, /candidateEmail|vaAuth/);
});

test("signed Resend events distinguish email signals from actual shortlist views", () => {
  assert.match(webhook, /event\.type === "email\.opened"/);
  assert.match(webhook, /event\.type === "email\.clicked"/);
  assert.match(webhook, /client_shortlist_email_opened/);
  assert.match(webhook, /client_shortlist_email_clicked/);
  assert.match(recruiter, /client_shortlist_viewed/);
  assert.match(recruiter, /not proof of reading/);
});
