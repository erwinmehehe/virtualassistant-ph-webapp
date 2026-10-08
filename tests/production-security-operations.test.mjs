import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");

test("compromised-password lookup treats unavailable and malformed responses as unavailable, not clean", async () => {
  const helper = await read("src/lib/pwned-password.ts");
  assert.match(helper, /Promise<boolean \| null>/);
  assert.match(helper, /if \(!password\) return null/);
  assert.match(helper, /if \(!response\.ok\)/);
  assert.match(helper, /return null/);
  assert.match(helper, /rows\.some\(\(line\) => !/);
  assert.match(helper, /invalid response/);
  assert.match(helper, /catch \(error\)/);
  assert.match(helper, /sha1\.slice\(0, 5\)/);
  assert.match(helper, /"Add-Padding": "true"/);
  assert.doesNotMatch(helper, /range\/\$\{password\}/);
});

test("all app-controlled password changes stop when breach verification is unavailable", async () => {
  const [auth, training, account] = await Promise.all([
    read("src/app/actions/auth.ts"),
    read("src/app/actions/training-auth.ts"),
    read("src/app/actions/account-security.ts"),
  ]);
  assert.match(auth, /const signupBreachCheck = await isKnownCompromisedPassword\(parsed\.data\.password\)/);
  assert.match(auth, /signupBreachCheck === null/);
  assert.match(auth, /const resetBreachCheck = await isKnownCompromisedPassword\(password\)/);
  assert.match(auth, /resetBreachCheck === null/);
  assert.ok(auth.indexOf("signupBreachCheck === null") < auth.indexOf("admin.auth.admin.generateLink"));
  assert.ok(auth.indexOf("resetBreachCheck === null") < auth.indexOf("supabase.auth.updateUser({ password })"));
  assert.match(training, /trainingBreachCheck === null/);
  assert.match(training, /"breach_check_unavailable"/);
  assert.ok(training.indexOf("trainingBreachCheck === null") < training.indexOf("admin.auth.admin.generateLink"));
  assert.match(account, /accountBreachCheck === null/);
  assert.ok(account.indexOf("accountBreachCheck === null") < account.indexOf("supabase.auth.updateUser({ password: newPassword })"));
  for (const source of [auth, training, account]) {
    assert.match(source, /Password security verification is temporarily unavailable/);
  }
});

test("production Turnstile token verification checks expected hostname and action", async () => {
  const turnstile = await read("src/lib/turnstile.ts");
  assert.match(turnstile, /if \(!secret && !siteKey\) return true/);
  assert.match(turnstile, /if \(!secret \|\| !siteKey\)/);
  assert.match(turnstile, /result\.action !== expectedAction/);
  assert.match(turnstile, /if \(process\.env\.VERCEL_ENV === "production"\)/);
  assert.match(turnstile, /String\(result\.hostname \|\| ""\)\.toLowerCase\(\)/);
  assert.match(turnstile, /hostname mismatch/);
  assert.match(turnstile, /www\./);
  assert.match(turnstile, /challenges\.cloudflare\.com\/turnstile\/v0\/siteverify/);
});

test("production runbook gives explicit operator steps without requiring secrets in source", async () => {
  const runbook = await read("docs/PRODUCTION_SECURITY_CONFIGURATION.md");
  for (const name of ["SUPABASE_DB_URL", "BACKUP_ENCRYPTION_PASSPHRASE", "NEXT_PUBLIC_TURNSTILE_SITE_KEY", "TURNSTILE_SECRET_KEY"]) {
    assert.ok(runbook.includes(name), name);
  }
  assert.match(runbook, /Pro-only/);
  assert.match(runbook, /isolated PostgreSQL restore test/);
  assert.match(runbook, /36 hours/);
  assert.match(runbook, /Do not switch the production deployment to Cloudflare testing keys/);
});
