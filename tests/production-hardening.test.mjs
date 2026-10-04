import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read=(path)=>readFile(new URL(`../${path}`,import.meta.url),"utf8");

test("production runtime and Next maintenance LTS are pinned to the hardened versions",async()=>{
  const [pkg,lock]=await Promise.all([read("package.json"),read("package-lock.json")]);
  const packageJson=JSON.parse(pkg);
  const packageLock=JSON.parse(lock);
  assert.equal(packageJson.engines.node,"22.x");
  assert.equal(packageJson.dependencies.next,"15.5.27");
  assert.equal(packageJson.devDependencies["eslint-config-next"],"15.5.27");
  assert.equal(packageLock.packages["node_modules/next"].version,"15.5.27");
  assert.equal(packageLock.packages["node_modules/eslint-config-next"].version,"15.5.27");
  assert.equal(packageLock.packages["node_modules/@next/env"].version,"15.5.27");
  assert.equal(packageLock.packages["node_modules/@next/eslint-plugin-next"].version,"15.5.27");
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
  assert.match(restore,/supabase\/postgres:17\.6\.1\.155/);
  assert.match(restore,/pg_restore/);
  assert.match(restore,/--exit-on-error/);
  assert.match(restore,/public\.lead_intake/);
});
