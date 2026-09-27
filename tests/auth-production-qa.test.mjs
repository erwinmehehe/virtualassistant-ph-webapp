import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("password recovery pages own neutral noindex metadata", async () => {
  const [forgot, update] = await Promise.all([
    read("src/app/auth/forgot/page.tsx"),
    read("src/app/auth/update-password/page.tsx"),
  ]);

  for (const source of [forgot, update]) {
    assert.match(source, /export const metadata: Metadata/);
    assert.match(source, /robots: \{ index: false, follow: false \}/);
  }

  assert.match(forgot, /title: "Reset Password"/);
  assert.match(update, /title: "Choose a New Password"/);
  assert.doesNotMatch(forgot, /Hire Vetted Filipino Virtual Assistants/);
  assert.doesNotMatch(update, /Hire Vetted Filipino Virtual Assistants/);
});

test("password recovery inputs have explicit labels and autocomplete hints", async () => {
  const [forgot, update] = await Promise.all([
    read("src/app/auth/forgot/page.tsx"),
    read("src/app/auth/update-password/page.tsx"),
  ]);

  assert.match(forgot, /htmlFor="password-reset-email"/);
  assert.match(forgot, /id="password-reset-email"/);
  assert.match(forgot, /autoComplete="email"/);
  assert.match(update, /htmlFor="new-account-password"/);
  assert.match(update, /id="new-account-password"/);
  assert.match(update, /autoComplete="new-password"/);
});

test("training-only accounts have a real account settings destination", async () => {
  const [shell, page] = await Promise.all([
    read("src/components/training-shell.tsx"),
    read("src/app/workspace/training/account/page.tsx"),
  ]);

  assert.match(shell, /const accountHref = role \? "\/workspace\/account" : "\/workspace\/training\/account"/);
  assert.match(shell, /href=\{accountHref\}/);
  assert.match(page, /createClient\(\)/);
  assert.match(page, /supabase\.auth\.getUser\(\)/);
  assert.match(page, /Password & recovery/);
  assert.match(page, /href="\/auth\/forgot"/);
  assert.doesNotMatch(page, /requireAnyRole/);
});
