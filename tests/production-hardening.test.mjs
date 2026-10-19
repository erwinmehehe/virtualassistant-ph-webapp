import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("production Node and matching Next/ESLint release versions are pinned and locked",async()=>{
  const [pkg,lock]=await Promise.all([read("package.json"),read("package-lock.json")]);
  const packageJson=JSON.parse(pkg);
  const packageLock=JSON.parse(lock);
  assert.equal(packageJson.engines.node,"22.x");
  assert.equal(packageJson.dependencies.next,"16.4.2");
  assert.equal(packageJson.devDependencies["eslint-config-next"],"16.4.2");
  assert.equal(packageLock.packages["node_modules/next"].version,"16.4.2");
  assert.equal(packageLock.packages["node_modules/eslint-config-next"].version,"16.4.2");
  assert.equal(packageLock.packages["node_modules/@next/env"].version,"16.4.2");
  assert.equal(packageLock.packages["node_modules/@next/eslint-plugin-next"].version,"16.4.2");
});

test("production backup is daily, encrypted, retained off-provider, and restore-tested",async()=>{
  const [workflow,create,verify,restore]=await Promise.all([
    read(".github/workflows/database-backup.yml"),
    read("scripts/create-encrypted-db-backup.sh"),
    read("scripts/verify-encrypted-db-backup.sh"),
    read("scripts/restore-test-db-backup.sh"),
  ]);
  assert.match(workflow,/cron: "17 6 \* \* \*"/);
  assert.match(workflow,/Restore-test encrypted archive/);
  assert.match(workflow,/retention-days: 30/);
  assert.match(workflow,/production-database-backup/);
  assert.match(create,/aes-256-cbc/);
  assert.match(create,/pbkdf2/);
  assert.match(verify,/pg_restore --list/);
  assert.match(verify,/sha256sum --check/);
  assert.match(restore,/pg_restore --host=127\.0\.0\.1/);
  assert.match(restore,/--clean --if-exists/);
  assert.match(restore,/--single-transaction --exit-on-error/);
  assert.match(restore,/nspname !~ '\^pg_'/);
  assert.match(restore,/public\.lead_intake/);
  assert.match(restore,/public\.lead_intake/);
});
