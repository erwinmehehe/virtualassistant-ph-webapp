import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

const bootstrap = readFileSync("scripts/bootstrap-e2e-local-supabase.sh", "utf8");
const productionMigration = readFileSync(
  "supabase/migrations/20260922005659_move_pg_net_extension_out_of_public.sql",
  "utf8",
);

const localGuard = bootstrap.match(
  /assert_isolated_supabase_db\(\) \{([\s\S]*?)\n\}\nassert_isolated_supabase_db/,
);

function checkDatabaseGuard(dbUrl, apiUrl) {
  assert.ok(localGuard, "Missing disposable database guard");
  const snippet = "set -euo pipefail\nassert_isolated_supabase_db() {" +
    localGuard[1] + "\n}\nassert_isolated_supabase_db\n";
  return spawnSync("bash", ["-c", snippet], {
    encoding: "utf8",
    env: { ...process.env, DB_URL: dbUrl, API_URL: apiUrl },
  });
}

test("isolated migration bootstrap is valid Bash", () => {
  const check = spawnSync("bash", ["-n"], { input: bootstrap, encoding: "utf8" });
  assert.equal(check.status, 0, check.stderr);
});

test("disposable database guard admits only the expected local Supabase ports", () => {
  const local = checkDatabaseGuard(
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    "http://127.0.0.1:54321",
  );
  assert.equal(local.status, 0, local.stderr);

  const remote = checkDatabaseGuard(
    "postgresql://postgres:postgres@prod.example.com:54322/postgres",
    "http://127.0.0.1:54321",
  );
  assert.notEqual(remote.status, 0);
  assert.match(remote.stderr, /Refusing migration replay/);

  const wrongPort = checkDatabaseGuard(
    "postgresql://postgres:postgres@127.0.0.1:54323/postgres",
    "http://127.0.0.1:54321",
  );
  assert.notEqual(wrongPort.status, 0);

  const wrongApi = checkDatabaseGuard(
    "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
    "https://prod.example.com",
  );
  assert.notEqual(wrongApi.status, 0);
});

test("queued requests are cleared only by disposable test bootstrap before the exact migration", () => {
  const replayStart = bootstrap.indexOf("echo \"Replaying every repository migration");
  const guardCall = bootstrap.indexOf("assert_isolated_supabase_db\n");
  assert.ok(guardCall > 0 && guardCall < replayStart);

  assert.match(bootstrap, /clear_disposable_pg_net_queue\(\) \{\n  assert_isolated_supabase_db/);
  assert.match(bootstrap, /if \[ "\$name" = "20260922005659_move_pg_net_extension_out_of_public.sql" \]; then\n    clear_disposable_pg_net_queue\n  fi/);
  assert.match(bootstrap, /truncate table net\.http_request_queue/);
  assert.match(productionMigration, /pg_net request queue is not empty; refusing to reinstall/);
  assert.doesNotMatch(productionMigration, /\btruncate\b|\bdelete\b/i);
});
