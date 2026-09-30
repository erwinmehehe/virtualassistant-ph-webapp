import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("browser table grants stay aligned to the RLS operation surface", async () => {
  const [mainGrantCleanup, focusVerticalCleanup] = await Promise.all([
    read("supabase/migrations/20260930131508_align_browser_grants_with_rls_policies.sql"),
    read("supabase/migrations/20260930131603_align_focus_verticals_browser_grants.sql"),
  ]);

  assert.match(mainGrantCleanup, /revoke select, insert, update, delete on table[\s\S]*public\.profiles[\s\S]*from anon;/i);
  assert.match(mainGrantCleanup, /revoke insert, update, delete on table[\s\S]*public\.profiles[\s\S]*from authenticated;/i);
  assert.match(mainGrantCleanup, /revoke insert on table public\.notifications from authenticated;/i);
  assert.match(mainGrantCleanup, /revoke update on table public\.time_entries from authenticated;/i);
  assert.match(mainGrantCleanup, /revoke update, delete on table public\.training_enrollments from authenticated;/i);
  assert.match(focusVerticalCleanup, /revoke insert, update, delete on table public\.focus_verticals from authenticated;/i);
});
