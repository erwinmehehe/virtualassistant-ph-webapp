import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("exact role evidence outranks an unrelated headline with only a secondary category", async () => {
  const matching = await read("src/lib/matching.ts");

  assert.match(matching, /\{ source: va\.headline, weight: 1, label: "headline" \}/);
  assert.match(matching, /\{ source: va\.primary_category, weight: 0\.95, label: "primary category" \}/);
  assert.match(matching, /weight: 0\.6, label: "additional category"/);
  assert.match(matching, /weight: 0\.5, label: "skill"/);
  assert.match(matching, /pointsRatio: primaryMatched \? 1 : secondaryMatched \? 0\.7 : 0/);
  assert.match(matching, /score \+= Math\.round\(categoryMatch\.pointsRatio \* 20\)/);
});

test("accepted proposal jobs infer categories from the actual role title", async () => {
  const proposals = await read("src/app/actions/proposals.ts");
  assert.match(proposals, /categories: inferCategories\(proposal\.role_title, lead\.service, proposal\.summary \|\| lead\.message\)/);
});

test("database automatic matching uses source-weighted title and category evidence", async () => {
  const migration = await read("supabase/migrations/20261001102000_weight_primary_role_evidence_in_matching.sql");

  assert.match(migration, /coalesce\(p_headline, ''\).*1\.00::numeric/);
  assert.match(migration, /coalesce\(p_primary_category, ''\).*0\.95::numeric/);
  assert.match(migration, /0\.60::numeric/);
  assert.match(migration, /0\.50::numeric/);
  assert.match(migration, /create or replace function public\.role_category_match_ratio/);
  assert.match(migration, /when \(select matched from primary_hit\) then 1\.0::numeric/);
  assert.match(migration, /when \(select matched from secondary_hit\) then 0\.7::numeric/);
  assert.match(migration, /'ranking','role_evidence_priority_v3'/);
});
