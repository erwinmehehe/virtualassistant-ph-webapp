import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("VA badge counts avoid background revalidation but stay request-memoized", async () => {
  const source = await readFile("src/lib/workspace-badges.ts", "utf8");
  const va = source.slice(source.indexOf("async function getVaBadges"), source.indexOf("// Badge counts are advisory"));
  const result = source.slice(source.indexOf("export const getWorkspaceBadgeResult"));

  assert.match(va, /\.from\("notifications"\)/);
  assert.match(va, /\.select\("id", \{ count: "exact", head: true \}\)/);
  assert.match(va, /\.eq\("user_id", userId\)/);
  assert.match(va, /\.is\("read_at", null\)/);
  assert.match(va, /if \(error\) throw error;/);
  assert.match(va, /"\/workspace\/va\/notifications": Number\(count \|\| 0\)/);
  assert.doesNotMatch(va, /unstable_cache|workspace_badges/);
  assert.match(source, /export const getWorkspaceBadgeResult = cache\(/);
  assert.match(result, /if \(role === "va"\) \{[\s\S]*?getVaBadges\(userId\)/);
  assert.ok(result.indexOf('if (role === "va")') < result.indexOf("getCachedRoleBadges(role, userId)"));
  assert.match(result, /badges: \{\},[\s\S]*error: \{ message:/);
});

test("recruiter, client, and admin badge paths stay intact", async () => {
  const source = await readFile("src/lib/workspace-badges.ts", "utf8");
  assert.match(source, /const getCachedAdminBadges = unstable_cache/);
  assert.match(source, /const getCachedRoleBadges = unstable_cache/);
  assert.match(source, /\.rpc\("workspace_badges", \{ p_role: role, p_user_id: userId \}\)/);
  assert.match(source, /role === "client"/);
  assert.match(source, /role === "recruiter"/);
});
