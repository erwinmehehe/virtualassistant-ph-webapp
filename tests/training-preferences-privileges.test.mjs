import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("training learner preferences use least-privilege table grants", async () => {
  const sql = await readFile(
    "supabase/migrations/20260924100000_lock_training_preferences_privileges.sql",
    "utf8",
  );

  assert.match(sql, /revoke all on public\.training_learner_preferences from anon, authenticated/);
  assert.match(sql, /grant select, insert, update[\s\S]*to authenticated/);
  assert.match(sql, /grant all[\s\S]*to service_role/);
  assert.doesNotMatch(sql, /grant delete[\s\S]*to authenticated/);
});
