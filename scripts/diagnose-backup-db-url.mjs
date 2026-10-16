#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const PROJECT_REF = "ywkgcyilxhezrfxuwius";
const EXPECTED_USERNAME = "postgres." + PROJECT_REF;

// Return only fixed, non-secret reason codes. Never print the URL, password,
// a parser exception, or raw libpq/Docker diagnostics to workflow logs.
export function validateBackupDatabaseUrl(connectionString) {
  if (typeof connectionString !== "string" || !connectionString) {
    return { ok: false, reason: "SUPABASE_DB_URL is missing." };
  }
  if (connectionString !== connectionString.trim()) {
    return { ok: false, reason: "SUPABASE_DB_URL contains leading or trailing whitespace." };
  }

  let url;
  try {
    url = new URL(connectionString);
  } catch {
    return { ok: false, reason: "SUPABASE_DB_URL is not a valid PostgreSQL URI." };
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    return { ok: false, reason: "Expected a postgresql:// connection string." };
  }
  if (url.username !== EXPECTED_USERNAME) {
    return { ok: false, reason: "Shared session-pooler username must include the VAPH project reference." };
  }
  if (!/^aws-[0-9]+-[a-z0-9-]+\.pooler\.supabase\.com$/.test(url.hostname)) {
    return { ok: false, reason: "Host is not a Supabase shared pooler host; copy it from Supabase Connect." };
  }
  if (url.port !== "5432") {
    return { ok: false, reason: "Session pooler must use port 5432." };
  }
  if (url.pathname !== "/postgres") {
    return { ok: false, reason: "Expected the /postgres database path." };
  }
  if (!url.password) {
    return { ok: false, reason: "Database password is missing from the connection string." };
  }

  let password;
  try {
    password = decodeURIComponent(url.password);
  } catch {
    return { ok: false, reason: "Password has invalid URI percent-encoding." };
  }
  if (/^\[?(?:YOUR[-_ ]?(?:DB[-_ ]?)?PASSWORD|DATABASE[-_ ]?PASSWORD)\]?$/i.test(password)) {
    return { ok: false, reason: "Replace the password placeholder with the actual database password." };
  }
  if (url.hash) {
    return { ok: false, reason: "Connection string has a URL fragment; check password encoding." };
  }
  return { ok: true };
}

export function classifyConnectionError(stderr) {
  const message = typeof stderr === "string" ? stderr : "";
  if (/password authentication failed|SQLSTATE\s*28P01/i.test(message)) {
    return "Supabase rejected the credentials. The URI structure passed; check the current database password in the GitHub secret.";
  }
  if (/tenant or user not found/i.test(message)) {
    return "Supabase pooler could not match this host and project username; copy both from Supabase Connect.";
  }
  if (/could not translate host name|name or service not known|nodename nor servname provided/i.test(message)) {
    return "Supabase pooler hostname did not resolve.";
  }
  if (/connection refused|connection timed out|timeout expired|no route to host/i.test(message)) {
    return "Database connection was refused or timed out; check availability or network access.";
  }
  if (/SSL off|no pg_hba.conf entry/i.test(message)) {
    return "Database connection failed TLS or connection-policy checks; verify the Supabase connection settings.";
  }
  return "Database connection failed. Raw client errors are withheld to protect credentials.";
}

export function runDiagnostic(connectionString, run = spawnSync) {
  const check = validateBackupDatabaseUrl(connectionString);
  if (!check.ok) return { ok: false, message: check.reason };
  // The same PostgreSQL 17 client/container that pg_dump uses, with a read-only
  // SELECT. Pass only the variable name to docker; never put its value on a
  // runner command line or emit it to logs.
  const probe = run(
    "docker",
    [
      "run", "--rm", "-e", "SUPABASE_DB_URL", "postgres:17",
      "sh", "-eu", "-c",
      'psql --no-psqlrc "$SUPABASE_DB_URL" -X -q -A -t -c "SELECT 1" >/dev/null',
    ],
    {
      env: { ...process.env, SUPABASE_DB_URL: connectionString },
      stdio: ["ignore", "ignore", "pipe"],
      encoding: "utf8",
      timeout: 60_000,
      maxBuffer: 1024 * 1024,
    },
  );

  if (probe.error || probe.signal) {
    return { ok: false, message: "Unable to launch PostgreSQL preflight; no credentials were displayed." };
  }
  if (probe.status !== 0) {
    return { ok: false, message: classifyConnectionError(probe.stderr) };
  }
  return { ok: true, message: "Database authentication and read-only query passed." };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = runDiagnostic(process.env.SUPABASE_DB_URL);
  (result.ok ? console.log : console.error)("Backup DB preflight: " + result.message);
  if (!result.ok) process.exitCode = 1;
}
