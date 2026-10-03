import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production backup workflow never uploads a plaintext dump", async () => {
  const workflow = await readFile(".github/workflows/database-backup.yml", "utf8");
  const create = await readFile("scripts/create-encrypted-db-backup.sh", "utf8");
  const verify = await readFile("scripts/verify-encrypted-db-backup.sh", "utf8");

  assert.match(workflow, /workflow_dispatch/);
  assert.doesNotMatch(workflow, /schedule:/);
  assert.match(workflow, /SUPABASE_DB_URL/);
  assert.match(workflow, /BACKUP_ENCRYPTION_PASSPHRASE/);
  assert.match(workflow, /retention-days: 2/);
  assert.match(workflow, /steps\.backup\.outputs\.path/);

  assert.match(create, /postgres:17/);
  assert.match(create, /pg_dump/);
  assert.match(create, /--format=custom/);
  assert.match(create, /aes-256-cbc/);
  assert.match(create, /-pbkdf2/);
  assert.match(create, /trap cleanup EXIT/);
  assert.match(create, /rm -f "\$plain"/);

  assert.match(verify, /sha256sum --check/);
  assert.match(verify, /pg_restore --list/);
  assert.match(verify, /aes-256-cbc/);
});

test("backup runbook does not confuse archive verification with a restore rehearsal", async () => {
  const runbook = await readFile("docs/PRODUCTION_DATABASE_BACKUP.md", "utf8");
  assert.match(runbook, /Archive verification is not a full restore rehearsal/);
  assert.match(runbook, /isolated disposable PostgreSQL\/Supabase environment/);
  assert.match(runbook, /Do not claim the backup launch gate is complete/);
});
