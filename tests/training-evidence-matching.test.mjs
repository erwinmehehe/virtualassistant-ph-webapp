import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("verified training is capped at five supporting points and never satisfies hard requirements", async () => {
  const matching = await read("src/lib/matching.ts");
  assert.match(matching, /const bonus = Math\.min\(\s*5/);
  assert.match(matching, /missingHardRequirements\(job\.must_have_skills, va\.skills\)/);
  assert.match(matching, /missingHardRequirements\(job\.must_have_tools, va\.tools\)/);
  assert.match(matching, /trainingEvidence: VerifiedTrainingEvidence\[\] = \[\]/);
  assert.match(matching, /scoreWithTraining/);
  assert.match(matching, /trainingBonus: trainingMatch\.bonus/);
});

test("all recruiter shortlist score paths load verified training credentials", async () => {
  const [staff, actions, automatic] = await Promise.all([
    read("src/components/staff-job-matching.tsx"),
    read("src/app/actions/matching.ts"),
    read("src/lib/auto-matching.ts"),
  ]);
  assert.match(staff, /matchAssessment\(job,va,trainingCredentials\)/);
  assert.match(actions, /getTrainingCredentialsForUsers/);
  assert.match(actions, /matchAssessment\(job, va, trainingByUser/);
  assert.match(automatic, /getTrainingCredentialsForUsers/);
  assert.match(automatic, /matchAssessment\(job, va, trainingByUser/);
});

test("recruiter UI explains the training bonus without turning it into a gate", async () => {
  const table = await read("src/components/matching-candidate-table.tsx");
  assert.match(table, /add up to 5 supporting match points/);
  assert.match(table, /never satisfies must-have experience, tool, industry, or readiness requirements/);
  assert.match(table, /verified training/);
});


test("database-side suggestion refresh uses the same five-point verified-training cap", async () => {
  const sql = await read("supabase/migrations/20261004124500_add_verified_training_match_bonus.sql");
  assert.match(sql, /verified_training_match_bonus/);
  assert.match(sql, /least\(\s*5/);
  assert.match(sql, /training_certificates/);
  assert.match(sql, /cert\.revoked_at is null/);
  assert.match(sql, /tc\.status = 'published'/);
  assert.match(sql, /training_bonus := public\.verified_training_match_bonus/);
  assert.match(sql, /normalized := least\(100, normalized \+ coalesce\(training_bonus, 0\)\)/);
  assert.match(sql, /must_have_skills/);
  assert.match(sql, /must_have_tools/);
  assert.match(sql, /required_industries/);
});
