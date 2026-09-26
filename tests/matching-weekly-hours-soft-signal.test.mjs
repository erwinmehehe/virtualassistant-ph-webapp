import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("weekly hours affect match score without making a VA ineligible", async () => {
  const matching = await read("src/lib/matching.ts");
  assert.doesNotMatch(matching, /Needs \$\{job\.hours_per_week\} hrs\/week; profile shows/);
  assert.doesNotMatch(matching, /Number\(va\.weekly_hours \?\? 0\) < job\.hours_per_week/);
  assert.match(matching, /hoursFit/);
  assert.match(matching, /Number\(va\.weekly_hours\) \/ Number\(job\.hours_per_week\)/);
});

test("database auto-matcher no longer skips VAs below requested weekly hours", async () => {
  const migration = await read("supabase/migrations/20260926144000_make_weekly_hours_soft_match_signal.sql");
  assert.doesNotMatch(migration, /coalesce\(v\.weekly_hours,0\) < j\.hours_per_week then continue/);
  assert.match(migration, /v\.weekly_hours::numeric \/ greatest\(j\.hours_per_week,1\)/);
});
