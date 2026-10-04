import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production backup workflow never uploads a plaintext dump", async () => {
  const workflow = await readFile(".github/workflows/database-backup.yml", "utf8");
  const create = await readFile("scripts/create-encrypted-db-backup.sh", "utf8");
  const verify = await readFile("scripts/verify-encrypted-db-backup.sh", "utf8");

  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "17 6 \\* \\* \\*"/);
  assert.match(workflow, /SUPABASE_DB_URL/);
  assert.match(workflow, /BACKUP_ENCRYPTION_PASSPHRASE/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /Restore-test encrypted archive/);
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

test("backup runbook documents the automated isolated restore rehearsal and remaining secret gate", async () => {
  const runbook = await readFile("docs/PRODUCTION_DATABASE_BACKUP.md", "utf8");
  assert.match(runbook, /daily/);
  assert.match(runbook, /isolated disposable Supabase Postgres environment/);
  assert.match(runbook, /30 days/);
  assert.match(runbook, /Do not claim the backup launch gate is complete/);
});
