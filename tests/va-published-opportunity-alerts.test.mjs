import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const autoMatching = fs.readFileSync("src/lib/auto-matching.ts", "utf8");
const jobsAction = fs.readFileSync("src/app/actions/jobs.ts", "utf8");
const vaInterest = fs.readFileSync("src/app/actions/va-interest.ts", "utf8");

test("publishing a role runs the persisted-job matching hook", () => {
  assert.match(jobsAction, /autoReleaseTopMatches\(publishedJob\)/);
  assert.match(autoMatching, /\.from\("jobs"\)\.select\("\*"\)\.eq\("id", job\.id\)\.maybeSingle\(\)/);
  assert.match(autoMatching, /persistedJob\.status === "published"/);
  assert.match(autoMatching, /notifyMatchingVas: true/);
});

test("published opportunity alerts require a good match with enough evidence", () => {
  assert.match(autoMatching, /VA_OPPORTUNITY_SCORE_THRESHOLD = 60/);
  assert.match(autoMatching, /VA_OPPORTUNITY_CONFIDENCE_THRESHOLD = 50/);
  assert.match(autoMatching, /va\.availability_status === "available"/);
  assert.match(autoMatching, /\.in\("stage", \["approved", "bench"\]\)/);
  assert.match(autoMatching, /job\.status !== "published"/);
});

test("VA opportunity alerts use the published job and do not introduce the VA to the client", () => {
  assert.match(autoMatching, /title: `New opportunity: \$\{job\.title\}`/);
  assert.match(autoMatching, /This role appears to match your approved profile\. Review the role and express interest\./);
  assert.match(autoMatching, /href = `\/jobs\/\$\{job\.id\}`/);
  assert.match(autoMatching, /shortlist_status: "proposed"/);
  assert.match(autoMatching, /releasedCount: 0/);
  assert.doesNotMatch(autoMatching, /shortlist_status: "released"/);
});

test("published opportunity alerts are deduped and skip VAs who already expressed interest", () => {
  assert.match(autoMatching, /\.from\("notifications"\)[\s\S]*\.eq\("type", "matching"\)[\s\S]*\.eq\("href", href\)/);
  assert.match(autoMatching, /\.from\("applications"\)[\s\S]*\.eq\("job_id", job\.id\)/);
  assert.match(autoMatching, /!alreadyNotified\.has\(match\.vaId\)/);
  assert.match(autoMatching, /!alreadyInterested\.has\(match\.vaId\)/);
});

test("express interest still routes the VA to recruiter review before any client presentation", () => {
  assert.match(vaInterest, /status:"new"/);
  assert.match(vaInterest, /VA expressed interest for recruiter review/);
  assert.match(vaInterest, /The recruiter decides who is ready to be presented to the client|Review the VA inside the recruiter matching workspace before deciding whether to present them to the client/);
});
