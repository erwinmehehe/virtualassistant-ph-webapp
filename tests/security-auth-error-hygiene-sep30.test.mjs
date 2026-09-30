import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("authentication failures do not reflect provider error messages to browsers", async () => {
  const source = await read("src/app/actions/auth.ts");

  assert.match(source, /\[auth_oauth\] start_failed/);
  assert.match(source, /Could%20not%20start%20social%20login/);
  assert.doesNotMatch(source, /encodeURIComponent\(error\?\.message \|\| "Could not start social login"\)/);

  assert.match(source, /\[auth_login\] failed/);
  assert.match(source, /Email or password is incorrect\./);
  assert.doesNotMatch(source, /needsConfirmation \? "Confirm your email before logging in\." : error\.message/);

  assert.match(source, /We could not create your account\. Please try again\./);
  assert.doesNotMatch(source, /joinErrorPath\(parsed\.data\.role, error\?\.message/);

  assert.match(source, /\[auth_password_update\] failed/);
  assert.doesNotMatch(source, /auth\/update-password\?error=\$\{encodeURIComponent\(error\.message\)\}/);
});
