import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { evaluateBackupHealth } from "../scripts/backup-health-monitor.mjs";

const now = Date.parse("2026-10-08T12:00:00.000Z");
const success = {
  id: 1,
  status: "completed",
  conclusion: "success",
  created_at: "2026-10-08T06:17:00.000Z",
  updated_at: "2026-10-08T06:22:00.000Z",
};

test("only a completed and fresh backup-plus-restore run is healthy", () => {
  assert.equal(evaluateBackupHealth([success], now).healthy, true);
  assert.equal(evaluateBackupHealth([], now).healthy, false);
  assert.equal(evaluateBackupHealth([{ ...success, status: "in_progress" }], now).healthy, false);
  assert.equal(evaluateBackupHealth([{ ...success, updated_at: "2026-10-06T06:22:00Z" }], now).healthy, false);
  assert.equal(evaluateBackupHealth([{ ...success, updated_at: "2026-10-08T16:00:00Z" }], now).healthy, false);
});

test("a newer failed backup is unhealthy even if yesterday's backup worked", () => {
  const failed = {
    ...success,
    id: 2,
    conclusion: "failure",
    created_at: "2026-10-08T07:17:00.000Z",
  };
  const result = evaluateBackupHealth([success, failed], now);
  assert.equal(result.healthy, false);
  assert.equal(result.run.id, 2);
});

test("an in-progress run does not hide the latest completed backup", () => {
  const running = {
    ...success,
    id: 3,
    status: "in_progress",
    conclusion: null,
    created_at: "2026-10-08T08:17:00.000Z",
  };
  assert.equal(evaluateBackupHealth([running, success], now).healthy, true);
});

test("backup health alert runs independently of database credentials and keeps issue permissions scoped", async () => {
  const [workflow, monitor] = await Promise.all([
    readFile(new URL("../.github/workflows/backup-health-alert.yml", import.meta.url), "utf8"),
    readFile(new URL("../scripts/backup-health-monitor.mjs", import.meta.url), "utf8"),
  ]);
  assert.match(workflow, /workflow_run:/);
  assert.match(workflow, /Encrypted production database backup/);
  assert.match(workflow, /schedule:/);
  assert.match(workflow, /actions: read/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /persist-credentials: false/);
  assert.doesNotMatch(workflow, /SUPABASE_DB_URL|BACKUP_ENCRYPTION_PASSPHRASE/);
  assert.match(monitor, /actions\/workflows\/database-backup\.yml\/runs/);
  assert.match(monitor, /state: "closed"/);
  assert.match(monitor, /state: "open"/);
  assert.match(monitor, /36 \* 60 \* 60 \* 1000/);
  assert.doesNotMatch(monitor, /pg_dump|PGPASSWORD|secret_key/);
});
