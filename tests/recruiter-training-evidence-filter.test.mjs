import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const staffPath = "src/components/staff-job-matching.tsx";
const tablePath = "src/components/matching-candidate-table.tsx";
const matchingPath = "src/lib/matching.ts";
const cssPath = "src/app/workspace/recruiter-role-workspace.css";

test("recruiter matching receives completed learning paths as supporting evidence", async () => {
  const staff = await readFile(staffPath, "utf8");

  assert.match(staff, /completedTrainingSpecializations/);
  assert.match(staff, /const trainingCredentials=trainingByUser\.get\(va\.user_id\)\|\|\[\]/);
  assert.match(staff, /const trainingPaths=completedTrainingSpecializations\(trainingCredentials\)/);
  assert.match(staff, /return\{va,account,shortlist,job,interest,trainingCredentials,trainingPaths/);
});

test("candidate table can search and filter verified training without changing shortlist rules", async () => {
  const table = await readFile(tablePath, "utf8");

  assert.match(table, /trainingFilter/);
  assert.match(table, /Verified training/);
  assert.match(table, /Completed learning path/);
  assert.match(table, /row\.trainingPaths/);
  assert.match(table, /path\.title/);
  assert.match(table, /Directly relevant verified training can add up to 5 supporting match points/);
  assert.match(table, /matching-path-evidence/);
  assert.match(table, /Open recruiter scorecard/);
});

test("verified training can only add a capped supporting bonus to the core score", async () => {
  const matching = await readFile(matchingPath, "utf8");

  assert.match(matching, /const roleMatch = roleIdentityFit\(job, va\)/);
  assert.match(matching, /const categoryMatch = categoryFit\(job, va\)/);
  assert.match(matching, /const skills = overlapRatio\(job\.required_skills, va\.skills\)/);
  assert.match(matching, /const tools = overlapRatio\(job\.required_tools, va\.tools\)/);
  assert.match(matching, /const trainingMatch = verifiedTrainingFit\(job, trainingEvidence\)/);
  assert.match(matching, /Math\.min\(\s*5/);
  assert.match(matching, /missingHardRequirements\(job\.must_have_tools, va\.tools\)/);
});

test("recruiter evidence controls are responsive", async () => {
  const css = await readFile(cssPath, "utf8");

  assert.match(css, /\/\* Recruiter training evidence filters \*\//);
  assert.match(css, /\.matching-evidence-controls/);
  assert.match(css, /\.matching-path-evidence/);
  assert.match(css, /@media \(max-width: 620px\)[\s\S]*\.matching-evidence-controls/);
});
