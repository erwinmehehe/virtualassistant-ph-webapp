import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("open-role taxonomy backfill repairs obvious titles without overwriting existing categories", async () => {
  const migration = await read("supabase/migrations/20261001112000_backfill_open_role_taxonomy_and_rebuild_matches.sql");

  assert.match(migration, /executive assistant\|executive support/);
  assert.match(migration, /then 'Executive Assistance'/);
  assert.match(migration, /administrative\|admin/);
  assert.match(migration, /then 'Administrative Support'/);
  assert.match(migration, /array_prepend\(i\.inferred_category, array_remove\(coalesce\(j\.categories/);
  assert.match(migration, /status in \('pending','published'\)/);
});

test("stale auto suggestions are rebuilt while manual shortlist ownership is preserved", async () => {
  const migration = await read("supabase/migrations/20261001112000_backfill_open_role_taxonomy_and_rebuild_matches.sql");

  assert.match(migration, /s\.shortlist_status='proposed'/);
  assert.match(migration, /s\.created_by is null/);
  assert.match(migration, /select public\.refresh_all_match_suggestions\(\)/);
  assert.match(migration, /where s\.shortlist_status='proposed'/);
  assert.match(migration, /set match_score=scored\.new_score/);
  assert.match(migration, /match_confidence=scored\.new_confidence/);
});
