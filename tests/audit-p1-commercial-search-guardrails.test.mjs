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

test("public talent supports hourly-rate filtering and rate sorting through a server-only RPC", async () => {
  const page = await readFile("src/app/find-talent/page.tsx", "utf8");
  const search = await readFile("src/lib/talent-search.ts", "utf8");
  const migration = await readFile("supabase/migrations/20261003124000_talent_rate_filter_search_v2.sql", "utf8");

  assert.match(page, /name="min_rate"/);
  assert.match(page, /name="max_rate"/);
  assert.match(page, /value="rate_low"/);
  assert.match(page, /value="rate_high"/);

  assert.match(search, /search_public_va_directory_hybrid_v2/);
  assert.match(search, /p_min_rate/);
  assert.match(search, /p_max_rate/);

  assert.match(migration, /p_min_rate numeric default 0/);
  assert.match(migration, /p_max_rate numeric default null/);
  assert.match(migration, /p_sort = 'rate_low'/);
  assert.match(migration, /p_sort = 'rate_high'/);
  assert.match(migration, /revoke execute on function public\.search_public_va_directory_hybrid_v2/);
  assert.match(migration, /to service_role/);
});
