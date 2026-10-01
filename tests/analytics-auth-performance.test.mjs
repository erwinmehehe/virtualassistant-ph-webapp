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


test("invalid analytics payloads are dropped without polluting production 4xx monitoring",()=>{
  assert.match(route,/dropped: "invalid_json"/);
  assert.match(route,/dropped: "invalid_event"/);
  assert.doesNotMatch(route,/\{ ok: false \}.*status: 400/s);
});


test("analytics limiter infrastructure failures stay out of error-level production logs",()=>{
  const limiter=readFileSync("src/lib/rate-limit.ts","utf8");
  assert.match(route,/enforceActionRateLimit\("public_analytics:ip", requestIp\(request\), 240, 10, false\)/);
  assert.match(route,/enforceActionRateLimit\("public_analytics:session", parsed\.data\.session_id, 120, 10, false\)/);
  assert.match(limiter,/logInfrastructureFailure = true/);
  assert.match(limiter,/console\.warn\("\[rate-limit\] atomic limiter unavailable"/);
  assert.match(limiter,/if \(logInfrastructureFailure\)[\s\S]*console\.error\("\[rate-limit\] atomic limiter failed"/);
});
