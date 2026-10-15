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

test("isolated restore identifies the postgres database role explicitly", async () => {
  const { readFile } = await import("node:fs/promises");
  const source = await readFile(new URL("../scripts/restore-test-db-backup.sh", import.meta.url), "utf8");
  assert.match(source, /docker exec "\$container_name" pg_restore \\\n\s+--username=postgres/);
});
