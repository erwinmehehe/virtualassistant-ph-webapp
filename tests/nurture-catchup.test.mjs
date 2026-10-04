import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("existing nurture-stage leads are enrolled safely without emailing historical lost leads",async()=>{
  const migration=await readFile(
    new URL("../supabase/migrations/20261004182500_activate_existing_nurture.sql",import.meta.url),
    "utf8",
  );
  assert.match(migration,/crm_stage = 'nurture'/);
  assert.match(migration,/now\(\) \+ interval '14 days'/);
  assert.match(migration,/migration_catchup/);
  assert.match(migration,/not exists/);
  assert.match(migration,/on conflict \(lead_id\) do nothing/);
  assert.doesNotMatch(migration,/crm_stage = 'lost'/);
  assert.doesNotMatch(migration,/sequence,\s*'winback'/);
});
