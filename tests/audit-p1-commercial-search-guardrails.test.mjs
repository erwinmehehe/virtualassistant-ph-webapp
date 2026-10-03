import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("client self-publishing requires an explicitly verified client profile", async () => {
  const source = await readFile("src/app/actions/jobs.ts", "utf8");
  assert.match(source, /select\("can_self_publish_jobs,verified_at"\)/);
  assert.match(source, /clientProfile\?\.can_self_publish_jobs && clientProfile\?\.verified_at/);
});

test("public job content blocks direct contact, payment and off-platform hiring instructions", async () => {
  const action = await readFile("src/app/actions/jobs.ts", "utf8");
  const guard = await readFile("src/lib/hiring-circumvention.ts", "utf8");
  assert.match(action, /assertPublicHiringContentSafe/);
  assert.match(guard, /EMAIL_PATTERN/);
  assert.match(guard, /PHONE_PATTERN/);
  assert.match(guard, /DIRECT_PAYMENT_PATTERN/);
  assert.match(guard, /CIRCUMVENTION_PATTERN/);
  assert.match(guard, /Keep candidate contact and hiring inside VAPH/);
});

test("USD to PHP checkout never uses a hardcoded or stale fallback rate", async () => {
  const source = await readFile("src/lib/paymongo.ts", "utf8");
  assert.doesNotMatch(source, /FALLBACK_USD_PHP_RATE/);
  assert.doesNotMatch(source, /\b58\b/);
  assert.match(source, /A current USD\/PHP exchange rate is unavailable/);
  assert.match(source, /!isStale/);
  assert.match(source, /if \(!rate\)/);
});
