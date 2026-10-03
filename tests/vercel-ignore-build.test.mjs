import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Vercel ignore-build keeps runtime main deploys but skips non-runtime-only main changes", async () => {
  const source = await readFile("scripts/vercel-ignore-build.mjs", "utf8");

  assert.doesNotMatch(source, /if \(branch === "main"\) process\.exit\(1\);/);
  assert.match(source, /if \(branch === "main"\) process\.exit\(nonRuntimeOnly \? 0 : 1\);/);
  assert.match(source, /file\.startsWith\("docs\/"\)/);
  assert.match(source, /file\.startsWith\("tests\/"\)/);
  assert.match(source, /file\.startsWith\("\.github\/"\)/);
  assert.match(source, /scripts\/create-encrypted-db-backup\.sh/);
  assert.match(source, /scripts\/verify-encrypted-db-backup\.sh/);
  assert.match(source, /if \(!files\.length\) process\.exit\(1\);/);
  assert.doesNotMatch(source, /file\.startsWith\("src\/"\)/);
  assert.doesNotMatch(source, /file\.startsWith\("supabase\/migrations\/"\)/);
});
