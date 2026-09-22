import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const route=readFileSync("src/app/api/analytics/route.ts","utf8");

test("analytics avoids the slow user-record auth path",()=>{
  assert.match(route,/supabase\.auth\.getClaims\(\)/);
  assert.match(route,/claimsData\?\.claims\?\.sub/);
  assert.match(route,/user_id: userId/);
  assert.doesNotMatch(route,/getSessionProfile/);
  assert.doesNotMatch(route,/auth\.getUser\(/);
});

test("analytics remains anonymous-safe and never blocks product requests",()=>{
  assert.match(route,/const userId = typeof claimsData\?\.claims\?\.sub === "string" \? claimsData\.claims\.sub : null/);
  assert.match(route,/catch \{/);
  assert.match(route,/Never fail a product request because analytics storage is unavailable/);
  assert.match(route,/NextResponse\.json\(\{ ok: true \}\)/);
});
