import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("matching gives role title and category identity the strongest combined weight", async () => {
  const matching = await read("src/lib/matching.ts");

  assert.match(matching, /type JobLike = \{[\s\S]*title\?: string \| null/);
  assert.match(matching, /const roleMatch = roleIdentityFit\(job, va\)/);
  assert.match(matching, /assessedWeight \+= 35/);
  assert.match(matching, /score \+= Math\.round\(roleMatch\.pointsRatio \* 35\)/);
  assert.match(matching, /assessedWeight \+= 20/);
  assert.match(matching, /if \(categoryMatch\.matched\) score \+= 20/);
  assert.match(matching, /matchedKeywords/);
  assert.match(matching, /roleSources = \[/);
  assert.match(matching, /va\.headline/);
  assert.match(matching, /va\.primary_category/);
  assert.match(matching, /\.\.\.\(va\.categories \?\? \[\]\)/);
});

test("matching canonicalizes common role vocabulary and accepts richer exact phrase evidence", async () => {
  const matching = await read("src/lib/matching.ts");

  for (const phrase of [
    '"search engine optimization": "seo"',
    '"customer support": "customer service"',
    '"executive assistant": "executive assistance"',
    '"bookkeeper": "bookkeeping"',
    '"lead gen": "lead generation"',
  ]) {
    assert.ok(matching.includes(phrase), `missing matching alias: ${phrase}`);
  }

  assert.match(matching, /phraseContained\(need, have\) \|\| phraseContained\(have, need\)/);
  assert.match(matching, /technical seo/);
  assert.match(matching, /hubspot crm automation/);
});

test("work setup remains operational evidence but no longer blocks client matching", async () => {
  const [talent, matchingAction, staffMatching, migration] = await Promise.all([
    read("src/lib/talent-operations.ts"),
    read("src/app/actions/matching.ts"),
    read("src/components/staff-job-matching.tsx"),
    read("supabase/migrations/20261001093000_remove_work_setup_matching_gate_and_rank_role_identity.sql"),
  ]);

  const certification = talent.slice(
    talent.indexOf("export function isTalentAgencyCertified"),
    talent.indexOf("export function talentReadiness"),
  );
  assert.doesNotMatch(certification, /workSetupVerifiedAt|setupVerified/);
  assert.doesNotMatch(matchingAction, /verified work setup first/);
  assert.doesNotMatch(staffMatching, /recruiter-verified work setup/);
  assert.doesNotMatch(migration, /work_setup_verified_at is not null/);
  assert.match(migration, /availability_status = 'available'/);
  assert.match(migration, /availability_confirmed_at >= p_as_of - interval '30 days'/);
});

test("database-side suggestion refresh uses the same role-first ranking shape", async () => {
  const migration = await read("supabase/migrations/20261001093000_remove_work_setup_matching_gate_and_rank_role_identity.sql");

  assert.match(migration, /create or replace function public\.role_title_match_ratio/);
  assert.match(migration, /assessed := assessed \+ 35/);
  assert.match(migration, /raw_score := raw_score \+ 35\.0 \* role_ratio/);
  assert.match(migration, /assessed := assessed \+ 20/);
  assert.match(migration, /raw_score := raw_score \+ 20/);
  assert.match(migration, /'ranking','role_title_category_v2'/);
});
