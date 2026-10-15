import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("production backup workflow never uploads a plaintext dump", async () => {
  const workflow = await readFile(".github/workflows/database-backup.yml", "utf8");
  const create = await readFile("scripts/create-encrypted-db-backup.sh", "utf8");
  const verify = await readFile("scripts/verify-encrypted-db-backup.sh", "utf8");

  assert.match(workflow, /workflow_dispatch/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /cron: "17 6 \* \* \*"/);
  assert.match(workflow, /SUPABASE_DB_URL/);
  assert.match(workflow, /BACKUP_ENCRYPTION_PASSPHRASE/);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /Restore-test encrypted archive/);
  assert.match(workflow, /steps\.backup\.outputs\.path/);

  assert.match(workflow, /version: 2\.121\.0/);
  assert.match(create, /supabase db dump/);
  assert.match(create, /--role-only/);
  assert.match(create, /--use-copy --data-only/);
  assert.match(create, /roles\.sql schema\.sql data\.sql/);
  assert.match(create, /aes-256-cbc/);
  assert.match(create, /-pbkdf2/);
  assert.match(create, /trap cleanup EXIT/);
  assert.match(create, /rm -f "\$plain"/);

  assert.match(verify, /sha256sum --check/);
  assert.match(verify, /data\.sql roles\.sql schema\.sql/);
  assert.match(verify, /tar -tf/);
  assert.match(verify, /aes-256-cbc/);
});

test("backup runbook documents the automated isolated restore rehearsal and remaining secret gate", async () => {
  const runbook = await readFile("docs/PRODUCTION_DATABASE_BACKUP.md", "utf8");
  assert.match(runbook, /daily/);
  assert.match(runbook, /disposable Supabase PostgreSQL container/);
  assert.match(runbook, /30 days/);
  assert.match(runbook, /production backup gate is met only when a default-branch run completes successfully/);
});
