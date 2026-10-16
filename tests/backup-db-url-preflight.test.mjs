import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  validateBackupDatabaseUrl,
  classifyConnectionError,
  runDiagnostic,
} from "../scripts/diagnose-backup-db-url.mjs";

const correctUrl = "postgresql://postgres.ywkgcyilxhezrfxuwius:ExamplePassword123@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres";

test("accepts VAPH session pooler URI without exposing password", () => {
  assert.deepEqual(validateBackupDatabaseUrl(correctUrl), { ok: true });
  assert.deepEqual(validateBackupDatabaseUrl(correctUrl.replace("ExamplePassword123", "P%40ssword%232026")), { ok: true });
});

test("catches missing project ref in shared pooler username", () => {
  const result = validateBackupDatabaseUrl(correctUrl.replace("postgres.ywkgcyilxhezrfxuwius:", "postgres:"));
  assert.equal(result.ok, false);
  assert.match(result.reason, /username/i);
});

test("catches wrong host, transaction port, database path and scheme", () => {
  for (const [value, pattern] of [
    [correctUrl.replace(".pooler.supabase.com", ".example.com"), /host/i],
    [correctUrl.replace(":5432", ":6543"), /5432/],
    [correctUrl.replace(":5432/postgres", ":5432/other"), /database path/i],
    [correctUrl.replace("postgresql://", "https://"), /postgresql/i],
  ]) {
    const result = validateBackupDatabaseUrl(value);
    assert.equal(result.ok, false);
    assert.match(result.reason, pattern);
    assert.ok(!result.reason.includes("ExamplePassword123"));
  }
});

test("rejects missing, placeholder and invalidly encoded passwords", () => {
  for (const value of [
    "",
    correctUrl.replace("ExamplePassword123", ""),
    correctUrl.replace("ExamplePassword123", "%5BYOUR-PASSWORD%5D"),
    correctUrl.replace("ExamplePassword123", "broken%XX"),
    " " + correctUrl,
  ]) {
    assert.equal(validateBackupDatabaseUrl(value).ok, false);
  }
});

test("classifies client errors without copying secret diagnostics into output", () => {
  for (const [stderr, pattern] of [
    ['FATAL: password authentication failed for user "postgres" postgres://secret.example', /rejected the credentials/i],
    ["FATAL: Tenant or user not found postgres://secret.example", /pooler could not match/i],
    ["connection timed out at host secret.example", /timed out/i],
    ["unrecognized error and embedded postgres://secret.example", /withheld/i],
  ]) {
    const message = classifyConnectionError(stderr);
    assert.match(message, pattern);
    assert.doesNotMatch(message, /secret\.example/);
  }
});

test("read-only probe uses same container client, only passes env var name, and suppresses stderr", () => {
  let args;
  const result = runDiagnostic(correctUrl, (cmd, argv, options) => {
    args = { cmd, argv, options };
    return { status: 0, stderr: "" };
  });
  assert.equal(result.ok, true);
  assert.equal(args.cmd, "docker");
  assert.ok(args.argv.includes("postgres:17"));
  assert.ok(args.argv.includes("SUPABASE_DB_URL"));
  assert.ok(!args.argv.join(" ").includes("ExamplePassword123"));
  assert.match(args.argv.join(" "), /SELECT 1/);
  assert.equal(args.options.env.SUPABASE_DB_URL, correctUrl);
  assert.deepEqual(args.options.stdio, ["ignore", "ignore", "pipe"]);
});

test("CLI on malformed URI does not log credential value", () => {
  const scriptPath = fileURLToPath(new URL("../scripts/diagnose-backup-db-url.mjs", import.meta.url));
  const secret = "UniqueUnloggedPassword789";
  const result = spawnSync(process.execPath, [scriptPath], {
    encoding: "utf8",
    env: {
      ...process.env,
      SUPABASE_DB_URL: "postgresql://postgres:" + secret + "@aws-0-ap-southeast-2.pooler.supabase.com:5432/postgres",
    },
  });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /username/i);
  assert.doesNotMatch(result.stdout + result.stderr, /UniqueUnloggedPassword789/);
});

test("backup workflow runs the credential-safe preflight before the dump", async () => {
  const { readFile } = await import("node:fs/promises");
  const content = await readFile(new URL("../.github/workflows/database-backup.yml", import.meta.url), "utf8");
  const preflight = content.indexOf("Diagnose database login without logging credentials");
  const dump = content.indexOf("Create encrypted production dump");
  assert.ok(preflight > 0 && dump > preflight);
  assert.match(content, /node scripts\/diagnose-backup-db-url\.mjs/);
});

test("complete PostgreSQL custom dump is encrypted with a portable checksum", async () => {
  const { readFile } = await import("node:fs/promises");
  const create = await readFile(new URL("../scripts/create-encrypted-db-backup.sh", import.meta.url), "utf8");
  const verify = await readFile(new URL("../scripts/verify-encrypted-db-backup.sh", import.meta.url), "utf8");
  assert.match(create, /pg_dump.*--format=custom --no-owner --no-privileges --no-subscriptions/);
  assert.match(create, /--user "\$\(id -u\):\$\(id -g\)"/);
  assert.match(create, /openssl enc -aes-256-cbc/);
  assert.match(create, /-pbkdf2 -iter 250000/);
  assert.match(create, /digest="\$\(sha256sum "\$encrypted"/);
  assert.match(create, /basename "\$encrypted"/);
  assert.match(create, /rm -rf "\$stage"/);
  assert.doesNotMatch(create, /supabase db dump/);
  assert.match(verify, /sha256sum --check/);
  assert.match(verify, /pg_restore --list/);
  assert.match(verify, /cd "\$\(dirname "\$encrypted"\)"/);
});

test("full recovery rehearsal cleans only disposable schemas and preserves public", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../scripts/restore-test-db-backup.sh", import.meta.url), "utf8");
  assert.match(source, /supabase_admin/);
  assert.match(source, /DROP SCHEMA IF EXISTS/);
  assert.match(source, /nspname !~ '\^pg_'/);
  assert.match(source, /'information_schema','public'/);
  assert.match(source, /--clean --if-exists/);
  assert.match(source, /--no-owner --no-privileges/);
  assert.match(source, /--single-transaction --exit-on-error/);
  assert.match(source, /to_regclass\('public\.lead_intake'\)/);
  assert.match(source, /to_regclass\('auth\.users'\)/);
  assert.match(source, /to_regclass\('auth\.sessions'\)/);
  assert.match(source, /to_regclass\('storage\.objects'\)/);
  assert.match(source, /pg_policies/);
  assert.match(source, /docker rm -fv "\$container_name"/);
  assert.doesNotMatch(source, /SUPABASE_DB_URL/);
});

test("backup runs as a fail-closed pipeline and uploads only encrypted files", async () => {
  const { readFile } = await import("node:fs/promises");
  const workflow = await readFile(new URL("../.github/workflows/database-backup.yml", import.meta.url), "utf8");
  const verify = workflow.indexOf("Verify encrypted archive");
  const upload = workflow.indexOf("Upload encrypted off-provider artifact");
  const restore = workflow.indexOf("Restore-test encrypted archive");
  assert.ok(verify > 0 && upload > verify && restore > upload);
  assert.match(workflow, /retention-days: 30/);
  assert.match(workflow, /if-no-files-found: error/);
  assert.match(workflow, /node --test tests\/backup-db-url-preflight\.test\.mjs/);
  assert.match(workflow, /Diagnose database login without logging credentials/);
  assert.doesNotMatch(workflow, /Install Supabase CLI/);
});

test("checksums survive artifact download and isolated restoration never contacts production", async () => {
  const { readFile } = await import("node:fs/promises");
  const create = await readFile(new URL("../scripts/create-encrypted-db-backup.sh", import.meta.url), "utf8");
  const verify = await readFile(new URL("../scripts/verify-encrypted-db-backup.sh", import.meta.url), "utf8");
  const restore = await readFile(new URL("../scripts/restore-test-db-backup.sh", import.meta.url), "utf8");
  assert.match(create, /digest="\$\(sha256sum "\$encrypted"/);
  assert.match(create, /basename "\$encrypted"/);
  assert.match(verify, /cd "\$\(dirname "\$encrypted"\)"/);
  assert.match(restore, /cd "\$\(dirname "\$encrypted"\)"/);
  assert.match(restore, /POSTGRES_PASSWORD=postgres/);
  assert.doesNotMatch(restore, /SUPABASE_DB_URL/);
});
